import { CheerioCrawler, Dataset, RequestQueue } from 'crawlee'

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

      
      // data extraction saving
      await Dataset.pushData({
        url: request.url, // the url to scrape
        html: body, // a full copy of the page
        events, // the data we gathered
      })
      

      
      events.forEach(async (event) => {
        console.log('eventeventevent', event)
        // const res = await sendRequest({
        //   proxyUrl: 'https://www.googleapis.com/calendar/v3/calendars/calendarId/events',
        //   method: 'POST',
        //   body: event,
        //   key: 'AIzaSyCMrQytlGXocAR5t0Pk5VcCUaBSEUB7PGg'
        // })
        await sendRequest('https://www.googleapis.com/calendar/v3/calendars/009d4f099bab82adfebc3444353be8632dc4673fde366505adf5dd36fd35044e@group.calendar.google.com/events', {
          method: 'POST',
          // calendarId: '009d4f099bab82adfebc3444353be8632dc4673fde366505adf5dd36fd35044e@group.calendar.google.com',
          body: event,
          // key: 'AIzaSyCMrQytlGXocAR5t0Pk5VcCUaBSEUB7PGg'
        })
      })



    },
})



await mainCrawler.run(['https://www.wasatchmountainclub.org/calendar/2025/April'])

console.log('========== CRAWL COMPLETE ==========')