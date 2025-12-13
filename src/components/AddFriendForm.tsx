import { useState } from "react";
import { db } from "../db/db";

export function AddFriendForm({ defaultAge = 21 }: { defaultAge?: number }) {
  const [name, setName] = useState("")
  const [age, setAge] = useState(defaultAge)
  const [status, setStatus] = useState("")

  async function addFriend() {
    try {
      const id = await db.friends.add({ name, age })

      setStatus(`Friend ${name} successfully added. Got id ${id}`)
      setName("")
      setAge(defaultAge)
    } catch (error) {
      setStatus(`Failed to add ${name}: ${String(error)}`)
    }
  }

  return (
    <>
      <p>{status}</p>

      <label>
        Name:
        <input
          type="text"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
        />
      </label>

      <label>
        Age:
        <input
          type="number"
          value={age}
          onChange={(ev) => setAge(Number(ev.target.value))}
        />
      </label>

      <button onClick={addFriend}>Add</button>
    </>
  )
}
