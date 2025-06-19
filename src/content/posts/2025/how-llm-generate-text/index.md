---
title: How LLM Generate Text for the Rest of Us
publishDate: 2025-06-20
description: Learn how LLMs generate text token by token, and understand temperature, top-k, and top-p parameters. A practical guide for software engineers without ML background.
---

Ask the same question twice to any LLM and you'll get two similar yet subtly different responses. As software engineers without formal ML backgrounds and with limited knowledge of neural networks, the underlying mechanics can feel like magic.

You've probably seen advice like _"Use a low temperature to make the output deterministic"_ from one of those popular prompt engineering guides. These sound like old recipes passed down through generations of AI engineers because I lack the mental model of how those parameters affect the generated output. But here's the thing: it's actually more straightforward than I originally expected!

This article should give you a solid intuition for how these models select their tokens, and how parameters like `temperature`, `top-k`, and `top-p` influence the generated output. This doesn't go into the inference details, so if you're interested in the inner workings of the transformer architecture, sorry to disappoint; you can now close this tab.

## One token at a time...

Modern LLMs generate text one token at a time, using previously generated tokens as context for the next prediction. These are called **autoregressive models**. You can think of them as recursive functions that build results incrementally.

![Diagram showing autoregressive text generation where LLM progressively builds "I have a dream" one token at a time, with each step using previously generated tokens as input context](./recursive-token-generation.png)

LLMs don't directly manipulate raw text. Instead, LLMs operate on **tokens**. Tokens can represent words, word chunks, punctuation, or even special control sequences for tool calls or end-of-text markers. Each token maps to a unique identifier.

Each model has a predefined set of tokens it understands, established during training. The set of all possible tokens is called the model's **vocabulary**. Modern open-weight models like Llama 3 have vocabularies composed of 128K tokens, while closed-source models exceed 200K.

Now that we have a better understanding of the primitives LLMs manipulate, let's open the hood to see what's going on.

## The LLM inner workings

The LLM text generation pipeline breaks down into four distinct stages:

![Four-stage LLM pipeline diagram showing tokenization of "I have a" into tokens, inference producing logits for vocabulary tokens, decoding selecting "dream" token, and detokenization converting back to text](./generation-pipeline.png)

**Stage 1 - Tokenization:** The input text is converted into a token sequence. This step is fairly straightforward as it primarily consists of simple string manipulation and searching for the correct token in a lookup table.

**Stage 2 - Inference:** This is where the magic of the transformer architecture resides, and it's where the heavy lifting occurs. Given an input sequence of tokens, the LLM's core model computes a "score"—also called a logit—for every possible next token in its entire vocabulary. The higher the score, the greater the likelihood of seeing that specific token next in the sequence.

**Stage 3 - Decoding:** Based on the logits generated in the inference step, a decoding algorithm selects the actual next token. This selection isn't always about picking the highest-scoring token; sometimes, a bit of controlled randomness is introduced to spark "creativity".

**Stage 4 - Detokenization:** Once the next token is selected, it's converted back into human-readable text. As its name indicates, it's doing the reverse operation of the first stage.

### A few key insights

Understanding this pipeline helped me clarify some misconceptions I had about how LLMs work. Here are the insights that clicked for me:

**The inference stage doesn't pick tokens—it scores them.** I originally thought that the inference stage was in charge of selecting the next token, but that's not the case in practice. The inference phase produces a logit for each token in its vocabulary. If the model has a vocabulary composed of 128K tokens, the output layer produces a vector of 128K real values. Conceptually, it's like assigning a likelihood factor to all possible words in the dictionary every time we want to complete a sentence. At this stage, all potential tokens are still considered; they're just weighted with different scores.

**Most of the process is deterministic.** I find it fascinating that the vast majority of this generation process is _mostly_ deterministic. Tokenization and detokenization are deterministic by design. But more surprisingly, given the same input sequence, the inference phase always produces the same logits. The randomness in text generation is introduced entirely during the decoding phase.

**You only have limited control over the decoding.** As a developer, it's important to understand what you have control over. Major hosted LLM providers only expose parameters that influence the token selection in the decoding phase. You have no control over the (de)tokenization process or the inference. All the creative parameters you can tweak affect how the final token is selected from those pre-computed scores.

For the rest of the article, we will focus on the inner working of the decoding and how parameters influences the token selection.

## Decoding strategies

There are many ways to approach decoding. The most naive approach would be to always pick the most likely token each round. This approach is called **greedy search**. It turns out that the generated output is suboptimal—it's quite repetitive: they are highly repeative because of their deterministic nature. This is the reason why conversational LLM, introduces some randomness in the token selection process.

### From Scores to Probabilities: The Softmax Function

During inference, the model outputs logits for every token in its vocabulary. These values can range from negative infinity to positive infinity. To select the next token, those values need to be normalized to a probability distribution first, where each value should be in the `[0, 1]` range and where the sum equals `1`.

![TODO](image-placeholder)

This section contains some math equations, but bear with me. We'll go over each of them step by step.

The most straightforward, but naive, way to normalize each value is to divide each score by the sum of all the logits.

<div class="card-alt overflow-wrapper">
  <math>
    <mrow>
      <mi>normalized</mi>
      <mo form="prefix" stretchy="false">(</mo>
      <msub>
        <mi>z</mi>
        <mi>i</mi>
      </msub>
      <mo form="postfix" stretchy="false">)</mo>
      <mo>=</mo>
      <mstyle displaystyle="true" scriptlevel="0">
        <mfrac>
          <msub>
            <mi>z</mi>
            <mi>i</mi>
          </msub>
          <mrow>
            <mo>∑</mo>
            <mo form="prefix" stretchy="false">(</mo>
            <msub>
              <mi>z</mi>
              <mi>j</mi>
            </msub>
            <mo form="postfix" stretchy="false">)</mo>
          </mrow>
        </mfrac>
      </mstyle>
    </mrow>
  </math>
</div>

However, this approach falls short for two reasons, among others:

- It only works with positive values. However, that's not the case—logits can be negative.
- This naive approach has the tendency to soften the difference between values when the logit values increase.

Let's take the following logits as an example:

- `[10, 11, 12]` -> simple normalization -> `[0.27, 0.33, 0.36]`
- `[100, 101, 102]` -> simple normalization -> `[0.33, 0.33, 0.34]`

To solve these issues, LLMs use the **softmax function**. It's often used in machine learning and closely resembles "simple normalization" with the key difference that each logit is exponentiated.

<div class="card-alt overflow-wrapper">
  <math>
    <mrow>
      <mi>softmax</mi>
      <mo form="prefix" stretchy="false">(</mo>
      <msub>
        <mi>z</mi>
        <mi>i</mi>
      </msub>
      <mo form="postfix" stretchy="false">)</mo>
      <mo>=</mo>
      <mstyle displaystyle="true" scriptlevel="0">
        <mfrac>
          <msup>
            <mi>e</mi>
            <msub>
              <mi>z</mi>
              <mi>i</mi>
            </msub>
          </msup>
          <mrow>
            <mo>∑</mo>
            <mo form="prefix" stretchy="false">(</mo>
            <msup>
              <mi>e</mi>
              <msub>
                <mi>z</mi>
                <mi>j</mi>
              </msub>
            </msup>
            <mo form="postfix" stretchy="false">)</mo>
          </mrow>
        </mfrac>
      </mstyle>
    </mrow>
  </math>
</div>

Let's take the same example as before and now apply the softmax function:

- `[10, 11, 12]` -> softmax -> `[0.09, 0.24, 0.67]`
- `[100, 101, 102]` -> softmax -> `[0.09, 0.24, 0.67]`

The above example exhibits an interesting aspect of the softmax function. When all values are shifted by the same value, the softmax function produces the same output. This property in math is called translation invariance.

The softmax effectively acts as a "soft argmax," highlighting the most probable tokens while maintaining a valid probability distribution.

### Temperature: The Creativity Dial

The creative nature of LLMs comes from occasionally selecting less likely tokens. This behavior is controlled by the **temperature** parameter, which modifies the softmax function:

<div class="card-alt overflow-wrapper">
  <math>
    <mrow>
      <msub>
        <mi>p</mi>
        <mi>i</mi>
      </msub>
      <mo>=</mo>
      <mstyle displaystyle="true" scriptlevel="0">
        <mfrac>
          <msup>
            <mi>e</mi>
            <mrow>
              <msub>
                <mi>z</mi>
                <mi>i</mi>
              </msub>
              <mo>/</mo>
              <mi>T</mi>
            </mrow>
          </msup>
          <mrow>
            <mo>∑</mo>
            <mo form="prefix" stretchy="false">(</mo>
            <msup>
              <mi>e</mi>
              <mrow>
                <msub>
                  <mi>z</mi>
                  <mi>j</mi>
                </msub>
                <mo>/</mo>
                <mi>T</mi>
              </mrow>
            </msup>
            <mo form="postfix" stretchy="false">)</mo>
          </mrow>
        </mfrac>
      </mstyle>
    </mrow>
  </math>
</div>

Think of temperature as a scaling function for the probability distribution:

- **T < 1**: Increases the gap between high and low probability tokens (more deterministic)
- **T = 1**: Default behavior (most providers use this)
- **T > 1**: Reduces the gap between probabilities (more creative/random)

![Temperature Effects on Probability Distribution](image-placeholder)

Careful readers might have spotted that as the temperature tends toward `0`, the decoding becomes like **greedy search**, which is fully deterministic. However, even setting temperature to `0` doesn't guarantee completely deterministic output due to floating-point precision and implementation details.

Most providers constrain temperature ranges. OpenAI and Google accept temperatures in the `[0, 2]` range, while Anthropic restricts it further to `[0, 1]`.

While `1` is the default temperature value for most LLM providers, it's not the case for Ollama, which defaults to `0.8`. Individual models can override the default API temperature through [`Modelfile`](https://github.com/ollama/ollama/blob/main/docs/modelfile.md#basic-modelfile).

### Top-k Sampling: Limiting the Playing Field

Top-k sampling restricts token selection to only the K most probable tokens. This removes the "long tail" of unlikely options that might produce nonsensical output.

![TODO](image-placeholder)

**Example**: If k=3 and the top tokens are ["the", "a", "an"], the model can only choose from these three, regardless of their actual probabilities.

**The challenge**: Setting K appropriately. Too small, and you might discard good options when probabilities are evenly distributed. Too large, and you might include poor choices when probabilities are heavily skewed.

_Note: OpenAI's API doesn't expose top-k, but Google and Anthropic do._

### Top-p Sampling: Adaptive Token Selection

![TODO](image-placeholder)

Instead of a fixed number of tokens, top-p (nucleus sampling) uses a cumulative probability threshold. The model selects from the smallest set of tokens whose cumulative probability exceeds the threshold p.

**Example**: If p=0.9, the model considers tokens until their cumulative probability reaches 90%, then selects from that set.

This approach adapts better to different probability distributions:

- **Uniform distributions**: Includes more tokens
- **Skewed distributions**: Focuses on fewer, high-probability tokens

Top-p values should be between 0 and 1, where 1 has no effect on sampling.

## Putting It All Together

While not typically recommended, temperature, top-k, and top-p can be combined. They're applied in this order:

1. **Temperature scaling**: Adjust the probability distribution
2. **Top-k and top-p filtering**: Limit the candidate token set
3. **Renormalization**: Ensure probabilities sum to 1 for the filtered set
4. **Random sampling**: Select the final token using a random number generator

## Key Takeaways for Software Engineers

- **LLMs are mostly deterministic**: The randomness comes entirely from the decoding step, not the core model computation
- **Temperature is your primary creativity control**: Low values for consistency, higher values for creativity
- **Top-k and top-p provide additional control**: They filter the candidate set before selection
- **The heavy lifting is deterministic**: All the computational work happens in the predictable inference stage

## Going Deeper

Many LLM providers expose the underlying probability distributions through `logprobs` parameters. This opens up creative possibilities for classification tasks, confidence scoring, and quality assessment. Check out [OpenAI's logprobs cookbook](https://cookbook.openai.com/examples/using_logprobs) for practical examples.

Understanding these mechanics gives you better intuition for prompt engineering and helps you make informed decisions about when and how to adjust generation parameters for your specific use cases.

---

_The magic of LLMs isn't in their randomness—it's in how they learned to assign meaningful scores to tokens. The randomness just helps them avoid being boring._
