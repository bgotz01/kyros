import { CENTURIES } from '@/lib/capital/centuries';
import Timeline from './Timeline';

/** The same movement at century scale — capital center and the paradigm it ran. */
export default function CenturyTimeline() {
    return (
        <Timeline
            nodes={CENTURIES.map((c) => ({
                label: c.century,
                title: c.capitalCenter,
                caption: c.capitalParadigm,
            }))}
            nodeWidth={210}
        />
    );
}
