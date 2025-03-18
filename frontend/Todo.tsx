import { useState } from 'react';
import { Spacing } from '../shared/Spacing';
import { repo } from 'remult';

export function Todo() {
  const [response, setResponse] = useState('');
  async function testTheApi() {
    try {
      const result = await fetch('/api/spacing');
      if (!result.ok) {
        setResponse(`Error: ${result.status} ${result.statusText}`);
      }
      try {
        const json = await result.json();
        setResponse(JSON.stringify(json, null, 2));
      } catch (err: any) {
        setResponse(
          `Error: the result is not a json, probably because the route wasn't found`
        );
      }
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
    }
  }

  async function testInsert() {
    console.log('mopey');
    try {
      await repo(Spacing).insert({
        title: 'Task 1',
        spacings: [1, 2, 3],
        change_on: [4, 5, 6],
      });
    } catch (err: any) {
      setResponse(`Error: db not working`);
    }
  }

  return (
    <div>
      <button onClick={testTheApi}>Test The Api</button>
      <button onClick={testInsert}>Test Backend Insert</button>
      <main>
        <div>
          <h4>/api/tasks</h4>
        </div>
        <pre>
          result:
          <br />
          {response}
        </pre>
      </main>
    </div>
  );
}
