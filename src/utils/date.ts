/**
 * '03/12(수) 등록'과 같은 형식의 문자열에서 날짜를 추출하여 'Month/Day' 형식의 문자열로 변환
 * @param dateString 날짜가 포함된 문자열
 * @returns 변환된 Date 객체, 변환 실패 시 null
 */
export function extractDateFromString(dateString: string): string {
    const now = new Date();

    if (dateString.includes('/')) {
      // 날짜 부분만 추출 (예: '03/12(수) 등록' -> '03/12')
      const match = dateString.match(/\d{2}\/\d{2}/);
      if (!match) {
        return ''; // 유효한 날짜 형식이 없으면 null 반환
      }
  
      const dateStr = match[0];
      const [month, day] = dateStr.split('/').map(Number);
      return `${month}/${day}`;
    }
    else if (dateString.includes('일')) {
      // '3일 전 등록'과 같은 형식 처리
      const match = dateString.match(/(\d+)일 전/);
      if (match) {
        const daysAgo = parseInt(match[1], 10);
        const today = new Date(now.setDate(now.getDate() - daysAgo));
        const month = today.getMonth() + 1;
        const day = today.getDate();
        return `${month}/${day}`;
      }
      return '';
    }
    return '';
  }

/**
 * Date 객체를 형식화된 문자열로 변환
 * @param date Date 객체
 * @param format 출력 형식 (기본값: 'YYYY-MM-DD')
 * @returns 형식화된 날짜 문자열
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    // 한국 지역 설정으로 날짜 가져오기
    const localeDate = new Date(date.toLocaleDateString('ko-KR'));
    const year = localeDate.getFullYear();
    const month = String(localeDate.getMonth() + 1).padStart(2, '0');
    const day = String(localeDate.getDate()).padStart(2, '0');
  
    return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day);
}
