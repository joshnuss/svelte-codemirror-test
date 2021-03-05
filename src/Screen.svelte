<script>
  export let title = null
</script>

<section class="terminal">
  <div class="buttons">
    <svg xmlns="http://www.w3.org/2000/svg" width="54" height="14" viewBox="0 0 54 14">
      <g fill="none" fill-rule="evenodd" transform="translate(1 1)">
        <circle cx="5" cy="5" r="5" fill="#FF5F56" stroke="#E0443E" stroke-width=".5"/>
        <circle cx="25" cy="5" r="5" fill="#FFBD2E" stroke="#DEA123" stroke-width=".5"/>
        <circle cx="45" cy="5" r="5" fill="#27C93F" stroke="#1AAB29" stroke-width=".5"/>
      </g>
    </svg>
  </div>

	<div class="bar">

    <div class="title">{#if title}{title}{/if}</div>

	</div>

  <slot/>
</section>

<style>
  .terminal {
		font-family: monospace;
		font-size: 1.2rem;
    border: solid 1px var(--border-color);
		padding: 1rem;
		margin: 5rem;
		border-radius: 0.5rem;
    min-height: 20rem;
    background: var(--background-color);
		box-shadow: 2px 2px var(--shadow-color);
    color: var(--text-color);
    position: relative;
	}

	.terminal .bar {
    font-family: Inter;
		margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    place-items: center;
    align-items: center;
	}

  .buttons {
    position: absolute;
  }

  .title {
    font-size: 0.8rem;
    color: var(--text-color);
  }
</style>
