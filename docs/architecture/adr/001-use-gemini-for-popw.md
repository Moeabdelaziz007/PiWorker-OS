# ADR 001: Use Google Gemini as the Primary Oracle for Proof of Physical Work (PoPW)

## Status

Accepted

## Context

PiWorker-OS requires a reliable, fast, and cost-effective mechanism to verify physical tasks performed by agents or human operators. This verification mechanism is crucial for releasing funds from Escrow in our Zero-Trust architecture. We need a multimodal AI model (capable of analyzing images, video, and text) to act as an Oracle to validate "Proof of Physical Work" (PoPW).

We evaluated several models, including OpenAI's GPT-4V, Anthropic's Claude 3 Opus/Sonnet, and Google's Gemini (specifically Gemini 1.5 Pro/Flash).

## Decision

We will use **Google Gemini (Gemini 1.5 Pro/Flash)** as the primary Oracle for evaluating Proof of Physical Work (PoPW).

## Rationale (First Principles Approach)

1.  **Multimodal Natively:** Gemini was built from the ground up as a multimodal model. Its ability to natively process video frames, audio, and images simultaneously without relying on separate OCR or transcription models reduces latency and potential failure points in the verification pipeline.
2.  **Context Window:** Gemini 1.5's massive context window (up to 2M tokens) allows us to feed entire raw video feeds of a physical task, alongside the initial contract requirements and environmental data, in a single prompt. This provides a holistic view of the work done, which is impossible with models constrained by smaller context windows.
3.  **Speed and Latency (Flash):** Gemini 1.5 Flash offers near real-time multimodal reasoning. For robotic agents or human workers waiting for escrow release, latency is a critical bottleneck. Flash provides the necessary speed without sacrificing the reasoning capabilities required for complex PoPW verification.
4.  **Cost Efficiency:** In a decentralized ecosystem where micro-transactions and escrow fees must remain low, the cost per token (especially for video and image inputs) is a defining factor. Gemini provides a highly competitive pricing structure for multimodal inputs compared to GPT-4V, enabling sustainable PoPW at scale.

## Consequences

### Positive

- **Reduced Verification Latency:** Faster escrow releases due to Gemini Flash's speed.
- **Enhanced Verification Accuracy:** Massive context window allows for thorough video analysis of physical work.
- **Lower Operating Costs:** More cost-effective multimodal processing.

### Negative / Risks

- **Vendor Lock-in:** Relying heavily on Google's specific multimodal API structure.
- **Mitigation:** We must abstract the Oracle interface within the `core/finance/` and `sidecar/physical-bridge/` modules, ensuring that we can plug in alternative models (like Claude or open-source alternatives like LLaVA) if Gemini's pricing, availability, or capabilities change.

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Proof of Physical Work (PoPW) Whitepaper Section] (To be linked)
