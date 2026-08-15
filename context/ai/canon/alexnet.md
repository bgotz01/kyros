# AlexNet

**Krizhevsky, Sutskever, Hinton — "ImageNet Classification with Deep Convolutional
Neural Networks", NeurIPS 2012.**

A deep CNN trained on two consumer GPUs won ILSVRC-2012 with ~15.3% top-5 error
against ~26.2% for the runner-up — a margin unheard of in a benchmark that had
been improving by fractions of a percent per year.

## Inversion

The assumption that neural networks were a dead end, abandoned in favour of
hand-engineered features plus SVMs. Also the assumption that useful deep learning
required specialist hardware or an institutional cluster: the training ran on two
GTX 580s in a bedroom-scale setup.

Learned features beat designed features. An entire subfield of feature
engineering became obsolete in a single result.

## Incentives

Immediate and enormous. Vision was already commercially valuable (search,
photos, surveillance, later autonomy), and the barrier to entry was a gaming GPU.
Every lab could reproduce it within months; every company with images had a
reason to. Nvidia's incentive to encourage this was total, and CUDA became the
substrate of the field.

## Inflection

Genuine, and the fastest-recognised in the canon — consensus inside twelve
months. Downstream: the 2013–2016 deep learning boom, the acquisition wave
(DNNresearch, DeepMind), Nvidia's transformation from a graphics company into an
AI infrastructure company, and the talent pipeline that produced everything
since.

## Lesson for Kyros

The clean case. A cost curve broke (GPU training), the result was trivially
reproducible, and adoption required no permission from anyone. When all three
hold, the lag from artefact to consensus collapses to months.

Note also that the *paper* was not the only inflection — the availability of
ImageNet (Deng, Fei-Fei et al., 2009) was a precondition three years earlier that
almost nobody called at the time. Datasets and benchmarks can be inflections;
they are systematically under-weighted because they are not exciting.
