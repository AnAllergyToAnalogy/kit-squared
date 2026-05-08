<script lang="ts">
    // import { browser } from '$app/environment';

	// import * as buffer from "buffer";
	// if(browser){
	// 	//@ts-ignore
    // 	window.Buffer = buffer.Buffer;    
	// 	//@ts-ignore
	// 	window.process = process;
	// }
	import favicon from '$lib/assets/favicon.svg';

	import WalletSelection from '$lib/components/WalletSelection.svelte';
		
	let { children } = $props();



</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<WalletSelection />

{@render children()}
