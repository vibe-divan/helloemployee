import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const state = Route.useLoaderData();

  return <button type="button">Add 1 to {state}?</button>;
}
