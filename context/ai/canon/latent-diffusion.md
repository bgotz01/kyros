# Diffusion Models and the Stable Diffusion Release

**Ho, Jain, Abbeel — "Denoising Diffusion Probabilistic Models", NeurIPS 2020.
Rombach et al. — "High-Resolution Image Synthesis with Latent Diffusion Models",
CVPR 2022. Stable Diffusion weights released publicly, August 2022.**

Diffusion displaced GANs as the dominant generative image method; latent
diffusion made it cheap enough to run on consumer hardware.

## Inversion

Two, in sequence.

DDPM inverted the assumption that high-quality image generation required
adversarial training, with its instability and mode collapse. Latent diffusion
inverted the *cost* assumption by moving the diffusion process into a compressed
latent space, cutting the compute for both training and inference by roughly an
order of magnitude.

The constraint that disappeared was the datacentre. Image generation became
something a person could run on their own GPU.

## Incentives

The August 2022 open-weight release is the decisive event, not the papers. Within
months there was a full ecosystem — fine-tunes, LoRAs, interfaces, a commercial
tooling layer — none of which required permission from the originating lab.

Contrast with DALL·E 2, released around the same period as a gated service. The
technically comparable closed system produced a product; the open one produced an
industry, a subculture, and a legal fight.

## Inflection

Real, with consequences that ran well outside technology: the copyright
litigation wave over training data, the collapse of the stock-illustration price
floor, disputes in the creative professions, and the general public's first
direct experience of generative AI — for many, before ChatGPT.

## Lesson for Kyros

**The release decision can be a larger inflection than the method.** DDPM (2020)
and latent diffusion (2022) were both prerequisites, but the dated event that
changed the trajectory was a weights upload.

For any frontier result, model both branches explicitly: what happens if this is
gated, and what happens if the weights are public. The two futures diverge
sharply, and the choice is often made for reasons that have nothing to do with
the technology.
