// 확장 프로그램 기본 구조
import * as vscode from 'vscode';
import { fetchJobPostingHTML, getBodyHTMLsFromIframes, getJobPostingCount, parseJobPostingHTML } from './services/scraper';
import { JobPosting } from './models/job';

// 채용공고 트리 뷰 제공자
class JobPostingsProvider implements vscode.TreeDataProvider<JobItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<JobItem | undefined | null | void> = new vscode.EventEmitter<JobItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<JobItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private jobs: JobPosting[]) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: JobItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: JobItem): Thenable<JobItem[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve(this.jobs.map(job => new JobItem(job)));
    }
  }

  // 새 채용공고 추가 (나중에 크롤링 로직으로 대체)
  addJob(job: JobPosting): void {
    this.jobs.push(job);
    this.refresh();
  }

  // 채용공고 리셋
  resetJobs(): void {
    this.jobs = [];
    this.refresh();
  }
}

// 채용공고 아이템 클래스
class JobItem extends vscode.TreeItem {
  constructor(
    public readonly job: JobPosting
  ) {
    super(`${job.company}: ${job.title}`, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${job.title} at ${job.company} (${job.registeredDate})`;
    this.description = job.registeredDate;
    this.command = {
      command: 'jobCrawler.openJobURL',
      title: 'Open Job URL',
      arguments: [`https://www.gamejob.co.kr/List_GI/GIB_Read.asp?GI_No=${job.id}`]
    };
    this.contextValue = 'jobPosting';
  }
}

// 확장 프로그램 활성화 함수
export function activate(context: vscode.ExtensionContext) {
  console.log('채용공고 크롤러 확장 프로그램이 활성화되었습니다.');

  // 채용공고 제공자 생성
  const jobPostingsProvider = new JobPostingsProvider([]);
  
  // 트리 뷰 등록
  const treeView = vscode.window.createTreeView('jobCrawlerView', {
    treeDataProvider: jobPostingsProvider,
    showCollapseAll: true
  });

  // Secondary sidebar에 트리 뷰 등록
  context.subscriptions.push(treeView);

  // URL 열기 명령 등록
  context.subscriptions.push(
    vscode.commands.registerCommand('jobCrawler.openJobURL', (url: string) => {
      (async () => {
        // vscode.env.openExternal(vscode.Uri.parse(url));
        // 웹뷰 생성
        const panel = vscode.window.createWebviewPanel(
          'urlWebview',           // 내부 식별자
          'URL Viewer',            // 패널 제목
          vscode.ViewColumn.One,   // 표시 위치
          {
              enableScripts: true,  // 스크립트 실행 허용
              retainContextWhenHidden: true  // 백그라운드에서 컨텍스트 유지
          }
        );

        // 특정 URL 로드
        panel.webview.html = await getWebviewContent(url);
      })();
    })
  );

  // 채용공고 새로고침 명령 등록
  context.subscriptions.push(
    vscode.commands.registerCommand('jobCrawler.refreshJobs', async () => {
      jobPostingsProvider.resetJobs();
      // 실제로는 여기서 크롤링을 수행하고 결과를 jobPostingsProvider에 전달
      const totalJobPostingCount = await getJobPostingCount([16]);
      const totalPageCount = Math.ceil(totalJobPostingCount / 40);
      vscode.window.showInformationMessage(`총 ${totalJobPostingCount}개의 채용공고가 있습니다. 총 ${totalPageCount}페이지를 크롤링합니다.`);
      for (let i = 1; i <= totalPageCount; ++i) {
        const htmlString = await fetchJobPostingHTML([16], i);
        const result = parseJobPostingHTML(htmlString);
        for (let j = 0; j < result.length; ++j) {
          jobPostingsProvider.addJob(result[j]);
        }
      }

      vscode.window.showInformationMessage('채용공고 새로고침 중...');

      jobPostingsProvider.refresh();
      vscode.window.showInformationMessage('채용공고가 업데이트되었습니다.');
    })
  );
}

async function getWebviewContent(url: string): Promise<string> {
  const bodyHTMLs = await getBodyHTMLsFromIframes(url, ['GI_Work_Content', 'GI_Comment']);
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>URL Viewer</title>
  </head>
  <body>
      ${bodyHTMLs.map((html, index) => `
        <div class="iframe-content">
            <h3>Iframe Content ${index + 1}</h3>
            <div>${html}</div>
        </div>
        `).join('')}
  </body>
  </html>
  `;
}

// 확장 프로그램 비활성화 함수
export function deactivate() {}