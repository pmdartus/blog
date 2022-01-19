---
title: Generated GraphQL API for Salesforce
date: 2022-01-06
description: 'Exploring how to automatically generate a GraphQL API for a Salesforce organization.'
---

Back in 2016 [Robin Ricard](https://twitter.com/r_ricard) and presented at Dreamforce a talk about how to leverage GraphQL to query Salesforce data ([recording](https://www.youtube.com/watch?v=efEBcCtfARo)). For this talk we built a React Native demo application for browsing your favorite movies. The application retrieved the movies and actor details, stored in Salesforce custom objects, by the intermediary of GraphQL endpoint hosted on Heroku.

We had to author [custom GraphQL types](https://github.com/rricard/movieql/blob/cfd5e6ba8a4f319b18517be0ecc5e92f87878c5e/data/definitions.js#L3-L65) and hardcode some [SOQL queries](https://github.com/rricard/movieql/blob/cfd5e6ba8a4f319b18517be0ecc5e92f87878c5e/data/loaders.js#L26-L39) to retrieve the data on our Salesforce org. This approach works great for a demo application, but becomes quickly unmaintainable:

-   ensuring that the GraphQL schema is always in sync with the Salesforce schema is painful
-   exposing new types on the schema requires handcrafting new custom SOQL queries
-   no out-of-the-box support for filtering and sorting

A lot has happen during the last 5 years in the GraphQL ecosystem. We have seen a proliferation of products and tools making its adoption easier. I am amazed how easier it is to build a GraphQL endpoint on top of a SQL database with tools like [PostGraphile](https://www.graphile.org/) or [Hasura GraphQL Engine](https://hasura.io/docs/latest/graphql/core/index.html). Those tools connect to the database of your choice (eg. Postgres, MySQL) and automatically generates a GraphQL API. Considering Salesforce as a database under steroids, I was wondering if it was possible do the same thing: connecting any Salesforce organization to a service that would automatically generate a GraphQL endpoint.

As you might expect, the response is yes. During the winter break I started working a prototype of such service. The code can be found at [pmdartus/sfdc-graphql-endpoint](https://github.com/pmdartus/sfdc-graphql-endpoint). In the rest of this blog post I will present at a high level how the service works, how to generate a GraphQL schema from Salesforce metadata and finally how to efficiently query Salesforce APIs to resolve GraphQL queries. 

## Why GraphQL?

GraphQL is a query language for APIs. It is an alternative option to REST endpoint. Facebook developed it as an internal technology to deliver versatile applications and has been released in open source back in 2015. It attempts to fix some of the existing 

If you are still fuzzy about GraphQL and its advantages I would recommend you giving a look at [Graphql document](https://graphql.org/) or watching the segment in my talk discussing [GraphQL core concepts](https://youtu.be/efEBcCtfARo?t=256).

## Overview of the GraphQL service

The GraphQL endpoint is a standalone server setting between the client and a Salesforce org. During the startup, the endpoint retrieve the Salesforce org metadata for a predefined set of standard and custom object and build a GraphQL schema in memory. It accepts a GraphQL queries on the `/graphql` endpoint.

{% image "./overview.png", "Architecture overview", "100vw" %}

### Generating a GraphQL schema using Salesforce metadata

Schema is a core concept of GraphQL. It defines a model of the data that can requested from the server. GraphQL schema is usually expressed via the schema definition language (SDL), a textual representation of objects exposed in the Graph.

```graphql
type Actor__c {
    Id: ID
    Name: String
}
```

Before accepting any query, the GraphQL endpoint has to build this schema in memory. It is used for various operations at runtime. This includes query validation, response validation and schema introspection. In our case we will need map Salesforce entities to GraphQL types.

We can retrieve the sobject metadata using the [describeSOjbect](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_describe.htm) REST API. It returns a complete description of an entity including the fields and child relationships.

Defining the GraphQL schema via the schema definition language works well whenever dealing with a static schema. SDL is not well suited for our use case where the GraphQL schema is dynamically generated. An alternative approach is to generate the schema programmatically via [`graphql/type`](https://graphql.org/graphql-js/type/) module. 

Each SObject can be represented via a [GraphQL object types](https://graphql.org/learn/schema/#object-types-and-fields). SObject fields types, can be grouped into 2 buckets: scalar fields and relationship fields.

- GraphQL with comes with a predefined list of [scalar types](https://graphql.org/learn/schema/#scalar-types). Scalars represents leaf values in the graph. This list includes: `Int`, `Float`, `String`, `Boolean` and `ID`. On the other hand, Salesforce offers a lot more [field types](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/field_types.htm), eg. `Date`, `Phone` or `Currency`. Fortunately GraphQL allows the definition of custom scalar, that can be used to serialize, deserialize and validate the missing Salesforce field types. A custom GraphQL scalar type can be created for each of the missing Salesforce scalar field type.
- GraphQL type system allow defining fields referring to other GraphQL object types in the schema. Salesforce lookups and master-detail relationships can be represented in GraphQL by creating a fields and setting its type to the related GraphQL object type.

For the GraphQL schema to be complete, we define a [`Query` type](https://graphql.org/learn/schema/#the-query-and-mutation-types). This type defines the entry points into the graph. For each SObject, we define 2 fields the `Query` type:
- a field named `[SObject_name]_by_id` returning a single record. This field accepts a required `ID` argument.
- a field named `[SObject]` returning a list of records. This field fields accepts optional arguments limit, filter and order the list.

Here is an example of a Salesforce schema and its generated GraphQL schema.

{% image "./salesforce-schema.png", "Salesforce schema", "100vw" %}

```graphql
scalar TextArea

type Movie__c {
  Id: ID!
  Name: String
  Roles__r: [Role__c]
}

type Role__c {
  Id: ID!
  Name: String
  Actor__c: Actor__c!
  Movie__c: Movie__c!
}

type Actor__c {
  Id: ID!
  Name: String
  Bio__c: TextArea
  Roles__r: [Role__c]
}

type Query {
  Movie__c(limit: Int, offset: Int, where: Movie__cWhere, order_by: [Movie__cOrderBy]): [Movie__c]
  Movie__c_by_id(id: ID): Movie__c
  Role__c(limit: Int, offset: Int, where: Role__cWhere, order_by: [Role__cOrderBy]): [Role__c]
  Role__c_by_id(id: ID): Role__c
  Actor__c(limit: Int, offset: Int, where: Actor__cWhere, order_by: [Actor__cOrderBy]): [Actor__c]
  Actor__c_by_id(id: ID): Actor__c
}
```

The source code for the GraphQL schema generation can be found in [`src/graphql/schema.ts`](https://github.com/pmdartus/sfdc-graphql-endpoint/blob/6fbe50366a8d6392a77e6b58bfb0689bf1680c5f/src/graphql/schema.ts) and [`src/graphql/types.ts`](https://github.com/pmdartus/sfdc-graphql-endpoint/blob/6fbe50366a8d6392a77e6b58bfb0689bf1680c5f/src/graphql/types.ts).

### Executing GraphQL query

Now that we have a better idea of how the GraphQL schema is generated, let's dive into the actual query execution.

After being validated against the schema, a GraphQL query is executed by the GraphQL server. The GraphQL server relies on function called [resolvers](https://graphql.org/learn/execution/#root-fields-resolvers) to execute a GraphQL query. The resolvers are functions that can be attached to any field on the schema. The function is in charge of retrieving the data for its field. The GraphQL execution will keep going until all the fields for the query are resolved.



#### Optimized queries using SOQL

### Filtering

## Things that I am excited about

## Closing words
