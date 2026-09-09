import { CENTURIES } from '@/lib/capital/centuries';
import Timeline from './Timeline';

/** The imperial succession at century scale, with the capital center beneath. */
export default function CenturyTimeline() {
    return (
        <Timeline
            nodes={CENTURIES.map((c) => ({
                label: c.century,
                title: c.empire,
                caption: c.capitalCenter,
            }))}
            nodeWidth={210}
        />
    );
}
