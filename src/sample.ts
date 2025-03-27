import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Navigate to the webpage containing the iframe (replace with actual URL)
        await page.goto('https://www.gamejob.co.kr/List_GI/GIB_Read.asp?GI_No=260101', { waitUntil: 'networkidle2' });
        const iframeByName = await page.$('iframe[name="GI_Work_Content"]');
        if (iframeByName) {
            const iframeSrc = await page.evaluate(iframe => iframe.src, iframeByName);
            await page.goto(iframeSrc, {
                waitUntil: 'networkidle2',
            });
            const bodyHTML = await page.evaluate(() => document.body.innerHTML);
            console.log('Body HTML:', bodyHTML);
            
        } else {
            console.log('Iframe not found');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
})();