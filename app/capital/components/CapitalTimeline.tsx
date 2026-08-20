import { PARADIGMS } from '@/lib/capital/paradigms';
import Timeline from './Timeline';

/** Where the world's capital accumulated, decade by decade. */
export default function CapitalTimeline() {
    return (
        <Timeline
            nodes={PARADIGMS.map((p) => ({
                label: p.decade,
                title: p.capitalCenter,
                caption: p.narrative,
            }))}
        />
    );
}
