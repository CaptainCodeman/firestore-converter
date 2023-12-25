<script lang="ts">
	import { getPeople } from './firebase';

	export let data;

	$: people = data.people;

	async function load() {
		people = await getPeople();
	}

	$: console.log(people);
</script>

<button on:click={load}>Load</button>

<ul>
	{#each people as person}
		<li>
			<img src={`data:image/jpeg;base64,` + person.photo} alt="" />
			{person.id}
			{person.name}
			{person.dob}
		</li>
	{/each}
</ul>

<style>
	img {
		width: 48px;
		height: 48px;
	}
</style>
