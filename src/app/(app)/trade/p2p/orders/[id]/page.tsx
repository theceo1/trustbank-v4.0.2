// @ts-nocheck
import P2POrderDetails from '@/components/trades/p2p/P2POrderDetails';

// Wrapper component to handle the page props
function P2POrderDetailsWrapper({ orderId }: { orderId: string }) {
  return <P2POrderDetails orderId={orderId} />;
}

// Page component with Next.js page props
export default async function P2POrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // Return the wrapper component
  return <P2POrderDetailsWrapper orderId={params.id} />;
} 