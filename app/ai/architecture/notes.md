
The conceptual map

I would organize the entire subject into five levels:

Level	Core concepts
Representation	Tokens, tokenization, embeddings, positional encoding
Model architecture	Transformers, attention, Q/K/V, MLP, residuals, normalization, MoE
Training	Pretraining, loss, backpropagation, optimizers, SFT, RLHF/RL, distillation
Inference	Autoregression, logits, sampling, KV cache, GQA, quantization, test-time compute
AI systems	RAG, tools, agents, memory, multimodality





1. Tokenization — turning language into numbers

Before a model can process text, the text gets broken into tokens.

For example:

"Transformers are powerful"

might become something conceptually like:

["Transform", "ers", " are", " powerful"]

Each token corresponds to an integer ID.

The important insight is that an LLM does not actually see words. It sees sequences of token IDs.

Different models use different tokenizers and vocabularies, often around tens or hundreds of thousands of tokens.

2. Embeddings — turning tokens into meaning-vectors

A token ID by itself has no useful meaning.

So the model converts every token into a vector:

token → [0.14, -0.72, 1.21, ...]

These are embeddings.

Instead of representing concepts as discrete labels, neural networks represent them as locations/directions in a high-dimensional mathematical space.

So conceptually:

tokenization = language → symbols

embedding = symbols → geometry

This idea goes far beyond LLMs. Embeddings are one of the foundational concepts of modern AI.

3. Neural networks

Underneath everything, an LLM is still a gigantic neural network.

The basic operation is surprisingly simple:

output = activation(input × weights + bias)

Training adjusts billions or trillions of weights so that the network becomes better at predicting the desired output.

A "parameter" is essentially one of these learned numerical values.

So:

7B model = ~7 billion parameters

70B model = ~70 billion parameters

More parameters generally provide more capacity, although architecture, data, and training matter enormously.

4. Transformers

This is the major architectural breakthrough behind modern LLMs.

The Transformer was introduced in 2017 and replaced the older idea that language had to be processed primarily one word after another.

Its central mechanism is:

Attention

Instead of only looking at the immediately preceding state, the model can determine:

Which other tokens are relevant to understanding this token?

Consider:

"The animal didn't cross the street because it was tired."

When processing it, attention can strongly connect it with animal.

You can imagine attention creating a dynamic web of relationships:

The animal didn't cross the street because it was tired
     ↑                                  │
     └──────────────────────────────────┘

This ability to dynamically relate tokens to other tokens is one of the reasons Transformers became so powerful.

5. Self-attention

In an LLM, tokens attend to other tokens within the same sequence.

Hence self-attention.

Each token generates three representations:

Q — Query

"What am I looking for?"

K — Key

"What information do I contain?"

V — Value

"What information should I contribute?"

The model compares:

Query × Key

to determine how much attention to give something.

Then it retrieves information from the corresponding Values.

So a simplified intuition is:

Q/K determine relevance; V carries the information.

This Q/K/V architecture is extremely important to understand.

6. Multi-head attention

The model doesn't perform attention just once.

It has multiple attention heads operating simultaneously.

Different heads can potentially capture different relationships:

syntax
subject/object relationships
positional relationships
semantic similarity
references to earlier entities
long-range dependencies

Then their outputs are combined.

Hence:

Multi-Head Attention.

7. The Transformer block

Attention isn't the whole Transformer.

A simplified Transformer block looks like:

Input
  ↓
Attention
  ↓
Residual connection
  ↓
Normalization
  ↓
Feed-forward network / MLP
  ↓
Residual connection
  ↓
Normalization

And then you stack many of these blocks:

Embedding
    ↓
Transformer block
    ↓
Transformer block
    ↓
Transformer block
    ↓
   ...
    ↓
Output

Large models may have dozens or hundreds of layers.

This distinction matters:

Attention = communication between tokens.

MLP = computation/transformation within each token representation.

8. MLP / Feed-Forward Network

This part often gets overshadowed by attention, but it is enormous.

After attention lets tokens exchange information, each token passes through a neural network usually called an MLP or FFN.

Conceptually:

Attention: "What information elsewhere matters?"

MLP: "Now what should I do with that information?"

A large fraction of an LLM's parameters are traditionally located in these feed-forward layers.

And this leads directly to...

9. Mixture of Experts — MoE

MoE changes the feed-forward part of the Transformer.

Instead of having one giant MLP that every token uses:

Token
 ↓
MLP

you create many MLPs:

             Expert 1
           ↗
Token → Router → Expert 2
           ↘
             Expert 3
             ...
             Expert 64

These are called experts.

A small router decides which experts should process each token.

Perhaps the model contains 64 experts but only activates 2 or 4 for a particular token.

This produces a critical distinction:

Total parameters vs active parameters

Imagine:

Total model: 500B parameters

Parameters used per token: 40B

You therefore get some of the representational capacity of a huge model without paying the full compute cost for every token.

This is called sparse activation.

MoE is consequently one of the most important architectures for scaling modern models efficiently.

10. Dense vs MoE models

A dense model activates essentially all of its Transformer parameters for every token.

A sparse MoE model activates only selected experts.

Conceptually:

DENSE

Token
 ↓
entire network
 ↓
output


MoE

Token
 ↓
router
 ↓
small subset of network
 ↓
output

MoE's advantage is primarily compute efficiency at scale.

Its disadvantages include greater training complexity, routing problems, memory requirements, communication overhead between GPUs, and experts potentially becoming poorly balanced.

11. Positional encoding

Attention by itself doesn't inherently understand order.

But:

Dog bites man

and

Man bites dog

contain the same tokens and mean very different things.

So Transformers need information about position.

Modern LLMs frequently use RoPE — Rotary Positional Embeddings.

RoPE mathematically rotates the Q/K representations according to token position.

You don't need the math initially. The conceptual point is:

RoPE gives attention information about relative token positions.

It also becomes important when discussing long context windows.

12. Context window

The context window is how much token history the model can work with during an inference call.

For example:

32K context

128K context

1M context

A larger context allows more documents, conversation history, code, etc. to be considered at once.

But context is not the same thing as permanent memory.

Think:

Weights = what the model learned during training

Context = information currently placed in front of it

That's a very important distinction.

13. KV cache

When generating text, the model doesn't want to recompute everything from scratch for every new token.

Suppose it has generated:

The capital of France is

and is about to generate the next token.

Previous attention calculations produce Keys and Values that can be cached.

Hence:

KV cache = stored attention state from previous tokens.

This dramatically speeds generation.

But KV cache consumes memory, especially with:

long contexts
large batch sizes
many attention heads

Which leads to another architectural innovation.

14. MHA, MQA and GQA

Traditional Transformers use:

MHA — Multi-Head Attention

Each attention head has its own Q, K and V projections.

That's powerful but memory-heavy.

MQA — Multi-Query Attention

Multiple query heads share the same K/V heads.

Much cheaper.

GQA — Grouped-Query Attention

A compromise.

Several query heads share each K/V head.

MHA
Q1 → K1 V1
Q2 → K2 V2
Q3 → K3 V3
Q4 → K4 V4


GQA
Q1 ─┐
Q2 ─┴→ K1 V1

Q3 ─┐
Q4 ─┴→ K2 V2

GQA has become important because it reduces KV-cache costs while retaining much of MHA's capability.

15. Autoregressive generation

Most LLMs generate one token at a time.

Given:

The capital of France is

the model calculates probabilities:

Paris       0.94
Lyon        0.02
France      0.01
...

It selects a token:

Paris

Then runs again:

The capital of France is Paris

and predicts the next token.

Thus an LLM is fundamentally doing:

predict next token → append token → predict next token → repeat

The remarkable part is how much sophisticated behavior emerges from this objective at sufficient scale.

16. Logits, softmax and temperature

The model's final layer produces numbers called logits for possible next tokens.

Softmax converts those into a probability distribution.

Then decoding controls how the next token is selected.

Temperature modifies how sharp that probability distribution is.

Lower temperature:

more concentrated / predictable

Higher temperature:

more diverse / unpredictable

Other decoding techniques include top-k and top-p sampling.

These are not really model architecture; they're inference strategies.

17. Pretraining

Architecture tells you what the machine looks like.

Training determines what it knows.

During pretraining, enormous amounts of text/code/etc. are fed into the model.

The basic task is often simply:

Predict the next token.

If:

"Paris is the capital of ___"

the model should assign high probability to:

France

Prediction errors produce a loss.

Backpropagation determines how the model's weights contributed to that error.

An optimizer adjusts the weights.

Repeat this trillions of times.

18. Fine-tuning / post-training

A pretrained model isn't automatically a good assistant.

Post-training teaches behavior.

This can include things like:

SFT — supervised fine-tuning

Examples of good question → answer behavior.

RLHF — reinforcement learning from human feedback

Humans provide preference information.

RLAIF

AI systems provide some preference feedback.

DPO and related methods

Directly optimize preferred responses relative to rejected responses.

More recent reasoning-oriented training can reward models for successfully solving tasks rather than merely imitating answers.

So:

Pretraining builds broad capability.

Post-training shapes behavior and specialized capability.

19. Reasoning models

"Reasoning model" isn't necessarily a fundamentally different architecture like Transformer vs RNN.

Often it means the model has been trained and deployed so it can spend substantially more computation solving difficult problems.

This introduces the concept of:

Test-time compute

Traditional scaling emphasized:

bigger training run → better model.

Reasoning systems also exploit:

more computation after the user asks the question → potentially better answer.

This is becoming one of the major dimensions of AI scaling.

20. Quantization

Suppose model weights are stored as:

FP32 — 32 bits

FP16/BF16 — 16 bits

You can approximate them using:

INT8

INT4

etc.

That's quantization.

Very roughly:

16-bit model
100 GB

↓ quantize

8-bit
~50 GB

↓ quantize

4-bit
~25 GB

Actual memory usage is more complicated, but that's the basic idea.

Quantization lets large models run much more cheaply and sometimes locally.

The tradeoff is potential accuracy degradation.

21. Distillation

Suppose you have a huge, excellent model:

Teacher

You use its outputs to train a smaller:

Student

The student learns to approximate some of the teacher's capabilities.

That's knowledge distillation.

Conceptually:

Huge expensive model
        ↓
   generated knowledge
        ↓
smaller efficient model

This is one route for turning expensive frontier capabilities into cheaper models.

22. RAG

Retrieval-Augmented Generation isn't really part of the neural architecture itself.

Instead:

User question
      ↓
Search / retrieval
      ↓
Relevant documents
      ↓
LLM context
      ↓
Answer

Rather than requiring everything to exist inside the model's weights, the model retrieves information when needed.

So there are two very different forms of knowledge:

Parametric knowledge → encoded in weights.

Retrieved knowledge → inserted into context.

RAG is the latter.

23. Tool use / agents

Another layer sits outside the model.

Instead of merely generating text:

LLM
 ↓
answer

you give the model access to actions:

             → Search web
             → Run Python
LLM → Tools  → Query database
             → Send email
             → Execute code

Now the model can reason about a problem, interact with external systems, observe the results, and continue.