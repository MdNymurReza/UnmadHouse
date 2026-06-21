export async function getStatus() {
  return {
    app: 'UnmadHouse backend',
    timestamp: new Date().toISOString()
  };
}
