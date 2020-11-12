const puppeteer = require('puppeteer');
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
    // TODO dynamically generate date based on current date
    await page.$eval(DATE_SELECTOR, el => el.value = '19-Nov-2020');

    await page.click(SEARCH_AVAILABILITY_SELECTOR);

    // BUG: Unable to select desired timeslot
    await page.waitForTimeout(2000);
    await page.click('#DayPilotCalendar1 > div:nth-child(2) > div > div:nth-child(2) > div > table:nth-child(3) > tbody > tr > td:nth-child(2) > div > div:nth-child(10) > div.calendar_safra_event_inner > div');
    
    // await page.click('#ConfirmButton_bt');
    // await page.waitForNavigation();
}

run();