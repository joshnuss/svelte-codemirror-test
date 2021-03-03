<section class="terminal">
	<div class="bar">
		<svg xmlns="http://www.w3.org/2000/svg" width="54" height="14" viewBox="0 0 54 14">
			<g fill="none" fill-rule="evenodd" transform="translate(1 1)">
				<circle cx="6" cy="6" r="6" fill="#FF5F56" stroke="#E0443E" stroke-width=".5"/>
				<circle cx="26" cy="6" r="6" fill="#FFBD2E" stroke="#DEA123" stroke-width=".5"/>
				<circle cx="46" cy="6" r="6" fill="#27C93F" stroke="#1AAB29" stroke-width=".5"/>
			</g>
		</svg>
	</div>

  <slot/>
</section>

<style>
  .terminal {
		font-family: monospace;
		font-size: 1.5rem;
    border: solid 2px var(--border-color);
		padding: 1rem;
		margin: 5rem;
		border-radius: 0.5rem;
    min-height: 20rem;
    background: var(--background-color);
		box-shadow: 2px 2px var(--medium-color);
    color: var(--text-color)
	}

	.terminal .bar {
		margin-bottom: 1rem;
	}
</style>
