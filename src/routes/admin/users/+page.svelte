<script lang="ts">
	import { enhance } from '$app/forms';

	export let data;

	let editingId: number | null = null;
	let editingRole: string = '';

	function startEdit(user) {
		editingId = user.id;
		editingRole = user.role;
	}

	function cancelEdit() {
		editingId = null;
		editingRole = '';
	}

	async function submitEdit(event) {
		event.preventDefault();
		if (editingId == null) return;

		const formData = new FormData();
		formData.set('id', editingId.toString());
		formData.set('role', editingRole);

		const response = await fetch('?/update', { method: 'POST', body: formData });
		if (response.ok) {
			const userIndex = data.users.findIndex((u) => u.id === editingId);
			if (userIndex >= 0) {
				data.users[userIndex] = { ...data.users[userIndex], role: editingRole };
			}
			cancelEdit();
		}
	}
</script>

<h2>Authorized Users</h2>
<div class="lookup-form">
	<h3>Add User</h3>
	<form method="POST" action="?/create" use:enhance>
		<div class="form-group">
			<label for="email">Email</label>
			<input type="email" id="email" name="email" required maxlength="255" />
		</div>
		<div class="form-group">
			<label for="role">Role</label>
			<select id="role" name="role" required>
				{#each data.roles as role}
					<option value={role}>{role}</option>
				{/each}
			</select>
		</div>
		<div class="form-group">
			<button type="submit">Add</button>
		</div>
	</form>
</div>

<h3>Users</h3>
<table class="table">
	<thead>
		<tr>
			<th>ID</th>
			<th>Email</th>
			<th>Role</th>
			<th>Edit</th>
			<th>Delete</th>
		</tr>
	</thead>
	<tbody>
		{#each data.users as user}
			<tr>
				<td>{user.id}</td>
				<td>{user.email}</td>
				<td>
					{#if editingId === user.id}
						<select bind:value={editingRole}>
							{#each data.roles as role}
								<option value={role}>{role}</option>
							{/each}
						</select>
					{:else}
						{user.role}
					{/if}
				</td>
				<td>
					{#if editingId === user.id}
						<button on:click={submitEdit}>
							<span class="material-symbols-outlined">save</span>
						</button>
						<button on:click={cancelEdit}>
							<span class="material-symbols-outlined">cancel</span>
						</button>
					{:else}
						<button on:click={() => startEdit(user)}>
							<span class="material-symbols-outlined">edit</span>
						</button>
					{/if}
				</td>
				<td class="slim-button">
					<form method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={user.id} />
						<button type="submit">
							<span class="material-symbols-outlined">delete</span>
						</button>
					</form>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
