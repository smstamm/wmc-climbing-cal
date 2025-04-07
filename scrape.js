import { CheerioCrawler, RequestQueue } from 'crawlee'
import { log } from 'console'

const mainCrawler = new CheerioCrawler({
  async requestHandler({ request, body, $, sendRequest }) {
      const events = []

      const climbingLinks = $('a[href]').map((_, el) => $(el).attr('href')).get().filter(desc => desc.includes('rock-climb'))

      const requestQueue = await RequestQueue.open()
      
      climbingLinks.map(async (activity) => {
        await requestQueue.addRequest({ url: `https://www.wasatchmountainclub.org${activity}` })
      })

      const detailCrawler = new CheerioCrawler({
        requestQueue,
        async requestHandler({ $ }) {
          const fullDescription = $('title').text()
          let shortDescription = fullDescription.includes(':') ? fullDescription.split(':')[1].split('-')[0] : fullDescription.split('-')[1]

          const capitalizeDescription = (desc) => {
            const splitStr = desc.trim().toString().split(' ')
            const capitalized = splitStr.map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
            return capitalized.join(' ')
          }

          let date
          const event = {}
          $('table > tr').each((_, el) => {
            const heading = $(el).find('td:first-child').text()

            switch(heading) {
              case 'Date:': {
                date = $(el).find('td:nth-child(2)').text()
                break
              }
              case 'Meeting Place:': {
                event.location = $(el).find('td:nth-child(2)').text()
                break
              }
              case 'Meeting Time:': {
                const time = $(el).find('td:nth-child(2)').text()
                event.start = {
                  dateTime: new Date(`${date} ${time}`),
                  timeZome: 'America/Denver'
                }
                event.end = {
                  dateTime: new Date(`${date} ${time}`),
                  timeZome: 'America/Denver'
                }
                break
              }
              default:
                break
            }

          })
          
          events.push({
            calendarId: '009d4f099bab82adfebc3444353be8632dc4673fde366505adf5dd36fd35044e@group.calendar.google.com',
            summary: capitalizeDescription(shortDescription),
            
            ...event
          })
        }
      })

      await detailCrawler.run()

      log('events!!', events)
    },
})

await mainCrawler.run(['https://www.wasatchmountainclub.org/calendar/2025/April'])
