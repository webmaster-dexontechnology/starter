export default defineEventHandler((event) => {
    const { name } = useQuery(event)

    return {
        message: `Hello, ninjas ${name}`
    }
  });