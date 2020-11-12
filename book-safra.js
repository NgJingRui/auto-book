const _ = require('lodash')
const datefn = require('date-fns')

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const CREDS = require('./creds');

// TODO: Move these constants to new file "const.js"
// dom element selectors
const USERNAME_SELECTOR = '#ctl00_Main_login_UserName';
const PASSWORD_SELECTOR = '#ctl00_Main_login_Password';
const BUTTON_SELECTOR = '#ctl00_Main_login_Login';

// Facility booking page's selectors
const FACILITY_SELECTOR = '#FacilityType_c1'
const BADMINTON_TAMPINES_OPTION = 'c247fcd2-6328-4edd-a989-e494cffbd208'
const DATE_SELECTOR ='#DateTimeRange_c1_tb'
const SEARCH_AVAILABILITY_SELECTOR = '#SearchDateRange_bt'

const TARGET_DATE = datefn.format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'dd-MMM-yyyy')
// Follow this syntax properly to find the time slots in the HTML
const TIMESLOTS = [
  '9:00 AM-10:00 AM',
]

puppeteer.use(StealthPlugin())

async function run() {
    const browser = await puppeteer.launch({ // default is true
        headless: false
    });

    const page = await browser.newPage();
    
    // Page 1: Login
    await page.goto('https://mysafra.safra.sg/web/login.aspx');
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(CREDS.username);

    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(CREDS.password);

    await page.click(BUTTON_SELECTOR);
    await page.waitForNavigation();

    // Page 2: Booking Badminton Courts
    await page.goto('https://mysafra.safra.sg/web/modules/BookingCalendar2/FacilityBookingSearch.aspx?ID=c6nEfGCq%2fR5CD94dd1GGK7sHZ%2fSyelV9A7BeRWD56FYmhJ%2fOy27f%2fw%3d%3d&TYPE=6qcJUPfjf6uL9fvUM2P6EU6zuO3eTG4rSVUGze9uZDOCsB73iL%2fsgiM2nihPlVjv%2fte9Ye%2fkH2aGF0jD8MVpug%3d%3d&')
    
    await page.select(FACILITY_SELECTOR, BADMINTON_TAMPINES_OPTION);
    await page.waitForTimeout(2000)
    await page.$eval(DATE_SELECTOR, (el, TARGET_DATE) => el.value = TARGET_DATE, TARGET_DATE);
    await page.click(SEARCH_AVAILABILITY_SELECTOR);

    await page.waitForTimeout(4000);
    
    const courts = [1, 2, 3]
    const slots = {}

    for (const court of courts) {
      const courtSlots = await page.$eval(
        `.calendar_safra_main > div:nth-child(2) > div > div:nth-child(2) > div > table:nth-child(3) > tbody > tr > td:nth-child(${court}) > div`,
        (el) => {
          const availableSlots = []
          const timeSlots = el.childNodes
          for (const idx in timeSlots) {
            const row = timeSlots[idx]
            try {
              const [status, timeslot] = row.children[0].children[0].innerText.split('\n')
              if (status.toLowerCase() === 'available') availableSlots.push({ number: Number(idx) + 1, timeslot })
            } catch (error) {
              console.warn('Something went wrong but no worries')
            }
          }
          return availableSlots
        }
      )
      if (courtSlots.length > 0) slots[court] = courtSlots
    }

    for (const court of courts) {
      let found = false
      const courtSlots = slots[court]
      for (slot of courtSlots) {
        if (_.includes(TIMESLOTS, slot.timeslot)) {
          found = true
          await page.click(`.calendar_safra_main > div:nth-child(2) > div > div:nth-child(2) > div > table:nth-child(3) > tbody > tr > td:nth-child(${court}) > div > div:nth-child(${slot.number}) > div.calendar_safra_event_inner > div`)
          break
        }
      }
      if (found) break

      if (!found && court == 3) {
        console.log('Boo no more slots :(')
        browser.close()
        process.exit(0)
      }
    }

    await page.waitForTimeout(3000);

    await page.click('#ConfirmButton_bt');
    await page.waitForNavigation();

    await page.click('#IsTermsAndConditionsEnable_c1');
}

run();