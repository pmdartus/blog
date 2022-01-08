---
title: Generated GraphQL API for Salesforce
date: 2022-01-06
description: 'Exploring how to automatically generate a GraphQL API for a Salesforce organization.'
---

Back in 2016 [Robin Ricard](https://twitter.com/r_ricard) and presented at Dreamforce a talk about how to leverage GraphQL to query Salesforce data. For this talk we built a React Native demo application for browsing your favorite movies. The application retrieved the movies and actor details, stored in Salesforce custom objects, by the intermediary of GraphQL endpoint hosted on Heroku.

<lite-youtube videoid="efEBcCtfARo"></lite-youtube>

We had to author [custom GraphQL types](https://github.com/rricard/movieql/blob/cfd5e6ba8a4f319b18517be0ecc5e92f87878c5e/data/definitions.js#L3-L65) and hardcode some [SOQL queries](https://github.com/rricard/movieql/blob/cfd5e6ba8a4f319b18517be0ecc5e92f87878c5e/data/loaders.js#L26-L39) to retrieve the data on our Salesforce org. This approach works great for a demo application, but becomes quickly unmaintainable:

-   ensuring that the GraphQL schema is always in sync with the Salesforce schema is painful
-   exposing new types on the schema requires handcrafting new custom SOQL queries
-   no out-of-the-box support for filtering and sorting

A lot has happen during the last 5 years in the GraphQL ecosystem. We have seen a proliferation of products and tools making its adoption easier. I am amazed how easier it is to build a GraphQL endpoint on top of a SQL database with tools like [PostGraphile](https://www.graphile.org/) or [Hasura GraphQL Engine](https://hasura.io/docs/latest/graphql/core/index.html). Those tools connect to the database of your choice (eg. Postgres, MySQL) and automatically generates a GraphQL API. Considering Salesforce as a database under steroids, I was wondering if it was possible do the same thing: connecting any Salesforce organization to a service that would automatically generate a GraphQL endpoint.

As you might expect, the response is yes. During the winter break I started working a prototype of such service. The code can be found at [pmdartus/sfdc-graphql-endpoint](https://github.com/pmdartus/sfdc-graphql-endpoint). In the rest of this blog post I will present at a high level how the service works, how to generate a GraphQL schema from Salesforce metadata and finally how to efficiently query Salesforce APIs to resolve GraphQL queries. If you are still fuzzy about GraphQL and its advantages I would recommend you giving a look at [Graphql document](https://graphql.org/) or watching the segment in my talk discussing [GraphQL core concepts](https://youtu.be/efEBcCtfARo?t=256).

## Overview of the GraphQL service

The GraphQL endpoint is a standalone server setting between the client and a Salesforce org. During the startup, the endpoint retrieve the Salesforce org metadata for a predefined set of standard and custom object and build a GraphQL schema in memory. It accepts a GraphQL queries on the `/graphql` endpoint.

### Generating a GraphQL schema using Salesforce metadata

Schema is a core concept of GraphQL. It defines a model of the data that can requested from the server. GraphQL schema is usually expressed via the schema definition language (SDL), a textual representation of objects exposed in the Graph.

```gql
type Person__c {
    Id: ID
    Name: String
}
```

Before accepting any query, the GraphQL endpoint has to build this schema in memory. It is used for various things at runtime, like query/response validation or schema introspection. In our case we will need map Salesforce entities to GraphQL types.

We can retrieve the sobject metadata using the [describeSOjbect](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_describe.htm) REST API. It returns a complete description of an entity including the fields and child relationships.

The schema definition language works well whenever you know in advance the data domain you are working with. This is not the case here as we

GraphQL comes with a predefined list of [scalar types](https://graphql.org/learn/schema/#scalar-types). Scalars represents leaf values in the graph. This list includes: `Int`, `Float`, `String`, `Boolean` and `ID`. On the other hand, Salesforce offers a lot more [field types](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/field_types.htm). Fortunately GraphQL allows the definition of custom scalar, that can be used to serialize, deserialize and validate the missing Salesforce field types.

```gql
scalar Date
scalar Email

type Person__c {
    Email__c: Email
    Birthday__c: Date
}
```

Now that we have a better idea of how the GraphQL schema is generated, let's dive into the actual query execution.

To access the graph, 

### Resolving GraphQL query

After being validated against the schema, a GraphQL query is executed by the GraphQL server. The GraphQL server relies on function called *resolvers* to execute a GraphQL query. The resolvers are functions that can be attached to any field on the schema. The function is in charge of retrieving the data for its field. The GraphQL execution will keep going until all the fields for the query are resolved.

```gql
query getMovieAndActors {
    Movies__c:
}
```

#### The naive approach

#### Optimized queries using SOQL

### Filtering

## Things that I am excited about

## Closing words

<script type="module" src="https://cdn.jsdelivr.net/npm/@justinribeiro/lite-youtube@1.3.1/lite-youtube.js"></script>
