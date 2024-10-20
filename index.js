import puppeteer from 'puppeteer';
import fs from "fs"
import { cidadesSaoPaulo, municipiosRS, municipiosRioDeJaneiro } from './cidades.js';

const GOOGLE_MAPS = 'https://www.google.com/maps/'
const DEFAULT_DELAY = 3000

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
 async function scrollPage(page, scrollContainer) {
    await page.waitForSelector(scrollContainer, {visible: true})
    let lastHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);
    while (true) {
        try{

            await page.evaluate(`document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`);
            await sleep(DEFAULT_DELAY)
            let newHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);
            if (newHeight === lastHeight){
                break;
            }
            lastHeight = newHeight
        }
        catch (e) {
            console.error(e)
            break;
        }
    }
  }

  async function extractDetails(page, url){
    try {
        await page.goto(url)
    } catch(error) {
        console.error(error)
        return {
            google_url: url,
            name: "",
            link: "" , 
            phone: "" ,
            address: "", 
        }
    }
    //sleep(1000)
    let name, link, phone, address;

    let google_url = url
    try {
        name = await page.$eval("#QA0Szd > div > div > div.w6VYqd > div.bJzME.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div:nth-child(1) > h1", el => el.innerText)
    } catch {
        name = ""
    }
    try{
        link = await page.$eval("a.CsEnBe", el => el.href)
    } catch{
        link = ""
    }
    try{
        phone = await page.$eval('button[data-tooltip="Copiar número de telefone"] > div > div.rogA2c > div.Io6YTe.fontBodyMedium.kR99db', el => el.innerText)
    } catch{
        phone = ""
    }
    try{
        address = await page.$eval('button[data-item-id="address"] > div > div.rogA2c > div.Io6YTe.fontBodyMedium.kR99db', el => el.innerText)
    } catch{
        address = ""
    }
    

    return {
        google_url: google_url,
        name: name,
        link: link && link.replace('\n', "") , 
        phone: phone ,
        address: address, 
    }
    
}

function generateTermsList(searchTerm, cities) {
    return cities.map(city => `${searchTerm} ${city}`);
}


async function scrape(page, searchTerm) {
console.log(`scraping ${searchTerm}`)
// Navigate the page to a URL.

// Type into search box.
await page.locator('#searchboxinput').fill(searchTerm);

// Wait and click on first result.
await page.locator('#searchbox-searchbutton').click();


// Wait scroll all the business
await scrollPage(page,".m6QErb[aria-label]" )

let businessLinks = await page.$$eval("a.hfpxzc", links => links.map(link => link.href))

let data = []

console.log(`Scraped ${businessLinks.length} links`)

let linksExtracted = 0;
for (let link of businessLinks){
  
    let detail = await extractDetails(page, link)
    data = [...data, detail]
    linksExtracted += 1
}

console.log(`Extracted ${linksExtracted} links`)

let jsonData = JSON.stringify(data, null, 2)


await (async function(searchTerm) {
    fs.writeFile(`./data/rs/${searchTerm.replace(/ /g, "_")}_data.json`, jsonData, function(err){
        if (err) {
            console.log(err)
        }
        else {
            console.log("file written")
        }
        })
}(searchTerm))



return
}

const browser = await puppeteer.launch({headless: true});
const page = await browser.newPage();
await page.goto(GOOGLE_MAPS);
// Set screen size.
await page.setViewport({width: 1080, height: 1024});
// click cookies 
await page.locator('::-p-aria(Aceitar tudo)').click();

let searchTerms = generateTermsList("clínica de estética", municipiosRS.splice(95) )

for (let i in searchTerms){
    await scrape(page, searchTerms[i])
    console.log(`Last Index was ${i}`)
}


await browser.close()