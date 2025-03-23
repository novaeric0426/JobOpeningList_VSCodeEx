import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { fetchJobPostingHTML, parseJobPostingHTML } from './services/scraper';

// 게임잡 채용공고 데이터 타입 정의
interface JobPosting {
  id: string;
  company: string;
  title: string;
  date: string;
  url: string;
}

/**
 * 게임잡 채용공고 크롤링 함수
 * @param page 페이지 번호
 * @returns 채용공고 배열
 */
async function getGamejobPostings(page: number = 1): Promise<JobPosting[]> {
  try {
    // 제공된 URL 및 페이로드 정보로 요청 생성
    const response = await axios({
      method: 'POST',
      url: 'https://www.gamejob.co.kr/Recruit/_GI_Job_List/',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'text/html, */*; q=0.01',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest' // AJAX 요청을 위한 헤더
      },
      // 페이로드 데이터 설정 (URL 인코딩 형태)
      data: `page=${page}&condition%5Bduty%5D=16&condition%5Bmenucode%5D=&condition%5Btabcode%5D=1&direct=0&order=3&pagesize=40&tabcode=1`
    });
    console.log(response.data);
    const filePath = path.join(__dirname, '..', 'data', 'jobList.html');
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, response.data, 'utf-8');


    // 응답 데이터가 HTML 형태이므로 cheerio로 파싱
    const $ = cheerio.load(response.data);
    const jobPostings: JobPosting[] = [];

    // 채용공고 목록에서 각 항목 추출
    $('.devJob').each((index, element) => {
      // 각 항목의 데이터 추출
      const jobId = $(element).attr('id') || `job-${Date.now()}-${index}`;
      const company = $(element).find('.company').text().trim();
      const title = $(element).find('.tit').text().trim();
      const date = $(element).find('.date').text().trim();
      
      // 링크 URL 추출 및 상대경로를 절대경로로 변환
      const relativeUrl = $(element).find('a').attr('href') || '';
      const url = relativeUrl.startsWith('http') 
        ? relativeUrl 
        : `https://www.gamejob.co.kr${relativeUrl}`;

      // 결과 배열에 추가
      jobPostings.push({
        id: jobId,
        company,
        title,
        date,
        url
      });
    });

    console.log(`${jobPostings.length}개의 채용공고를 찾았습니다.`);
    return jobPostings;
  } catch (error) {
    console.error('게임잡 크롤링 중 오류 발생:', error);
    return [];
  }
}

// 사용 예시
async function main() {
  console.log('게임잡 채용공고 크롤링 시작...');
  
  // 첫 번째 페이지 크롤링
  // const firstPageJobs = await getGamejobPostings(1);
  // console.log('1페이지 결과:', firstPageJobs);
  
  // const htmlString = fs.readFileSync(path.join(__dirname, '..', 'data', 'jobList.html'), 'utf-8');
  // const $ = cheerio.load(htmlString);
  // // Extract all <strong> elements and convert to an array with their text content
  // const jobInfos = $('strong').toArray().map(elem => $(elem).text().trim());
  // const modifiedDates = $('span.modifyDate').toArray().map(elem => $(elem).text().trim());
  
  // Display the array
  // console.log(jobInfos);
  // console.log(modifiedDates);
  const htmlString = await fetchJobPostingHTML([16], 1);
  const result = parseJobPostingHTML(htmlString);
  console.log(JSON.stringify(result, null, 2));
}

// 실행
main();