const maxRetries = 10
let retries = 0

const fail = async (reason) => {
  console.log(`Server is not listening`, reason)
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

while (retries < maxRetries) {
  retries++
  try {
    const response = await fetch('http://127.0.0.1:8080/')
    if (!response.ok) {
      await fail({ status: response.status, statusText: response.statusText, response })
    } else {
      console.log(`Server is listening`)
      process.exit(0)
    }
  } catch (error) {
    await fail(error)
  }
}
