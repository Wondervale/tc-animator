/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import type { FallbackProps } from "react-error-boundary";

export default function FallbackRender(props: FallbackProps) {
	// Call resetErrorBoundary() to reset the error boundary and retry the render.

	const { error } = props;

	return (
		<div role="alert">
			<p>Something went wrong:</p>
			<pre style={{ color: "red" }}>{error.message}</pre>
		</div>
	);
}
