<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import {WalletSelection} from "kit-squared";
		

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<WalletSelection />

{@render children()}
