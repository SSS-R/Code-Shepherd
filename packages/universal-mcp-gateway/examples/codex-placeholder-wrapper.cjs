let input = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  let payload;

  try {
    payload = JSON.parse(input);
  } catch (error) {
    console.error('Invalid JSON payload received by placeholder wrapper.');
    process.exit(1);
  }

  const content = String(payload?.command?.content ?? '').trim();
  const reply = content
    ? `Placeholder Codex bridge received your task: "${content}". The relay-to-gateway loop is working. Replace this wrapper with a real Codex runtime command to get true Codex responses.`
    : 'Placeholder Codex bridge is online, but the command content was empty.';

  process.stdout.write(JSON.stringify({
    replies: [
      {
        content: reply,
        messageType: 'text',
        metadata: {
          source: 'codex-placeholder-wrapper',
          mode: 'smoke-test',
        },
      },
    ],
  }));
});
