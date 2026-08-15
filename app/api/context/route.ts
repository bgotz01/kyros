import { pageRefsMeta } from '@/lib/pageContext';

/** Metadata for every attachable reference. Content is deliberately withheld —
 *  the client picks ids, the chat route resolves them server-side. */
export async function GET() {
    return Response.json(pageRefsMeta());
}
