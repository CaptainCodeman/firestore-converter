<script lang="ts">
	import { getPeople } from './firebase'

	let { data } = $props()
	let people = $state(data.people)

	async function load() {
		people = await getPeople()
	}
</script>

<button onclick={load}>Load</button>

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
