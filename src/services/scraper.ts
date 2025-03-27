import axios, { type AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { extractDateFromString } from '../utils/date';

// 채용공고 데이터 타입
interface JobPosting {
    id: string;
    company: string;
    title: string;
    registeredDate: string;
    url: string;
}

const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: 'https://www.gamejob.co.kr/Recruit/_GI_Job_List/',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'text/html, */*; q=0.01',
      'Cache-Control': 'no-cache',
      'X-Requested-With': 'XMLHttpRequest' // AJAX 요청을 위한 헤더
    },
};

/** 채용공고 목록을 HTML 형식으로 가져오는 함수 */
export const fetchJobPostingHTML = async (categories: number[], page: number): Promise<string> => {
    // 타겟 대상(직무 분야, 페이지) 설정 후 요청 생성
    let categoriesParamString = "";
    for (let i = 0; i < categories.length; ++i) {
        categoriesParamString += ``;
    }
    const response = await axios({     
        ...requestConfig,
        // 페이로드 데이터 설정 (URL 인코딩 형태)
        data: `page=${page}&condition%5Bduty%5D=${encodeURIComponent(categories.join(','))}&condition%5Bmenucode%5D=&condition%5Btabcode%5D=1&direct=0&order=3&pagesize=40&tabcode=1`
    });
    return response.data;
};

/** HTML을 파싱하여 채용공고 메타데이터 반환 */
export const parseJobPostingHTML = (html: string): JobPosting[] => {
    const $ = cheerio.load(html);

    // 회사명 및 채용공고 제목 추출
    const jobInfos = $('strong').toArray().map(elem => $(elem).text().trim()); // [회사명, 제목, 회사명, 제목 ...]
    
    // 공고 고유 ID 추출
    const ids = $('button.btnScrap').toArray().map(elem => $(elem).attr('data-value')?.split('|')[0] || '');

    // 수정일자 추출
    const registeredDates = $('span.modifyDate').toArray().map(elem => extractDateFromString($(elem).text().trim()));

    const jobPostings: JobPosting[] = [];
    for (let i = 0; i < ids.length; ++i) {
        jobPostings.push({
            id: ids[i],
            registeredDate: registeredDates[i],
            company: jobInfos[i * 2],
            title: jobInfos[i * 2 + 1],
            url: `https://www.gamejob.co.kr/List_GI/GIB_Read.asp?GI_No=${ids[i]}`

        });
    }
    return jobPostings;
};

/**  */
export const getBodyHTMLsFromIframes = async (baseUrl: string, iframeNames: string[]): Promise<string[]> => {
    const browser = await puppeteer.launch({ headless: true });
    
    const bodyHTMLs: string[] = [];
    for (let i = 0; i < iframeNames.length; ++i) {
        const page = await browser.newPage();
        await page.goto(baseUrl, { waitUntil: 'networkidle2' });
        const iframeName = iframeNames[i];
        const iframeHandle = await page.$(`iframe[name="${iframeName}"]`);
        const iframeSrc = iframeHandle ? await page.evaluate(iframe => iframe.src, iframeHandle) : '';
        console.log(iframeSrc);
        await page.goto(iframeSrc, {
            waitUntil: 'networkidle2',
        });
        const bodyHTML = await page.evaluate(() => document.body.innerHTML);
        bodyHTMLs.push(bodyHTML);
    }
    return bodyHTMLs;
};