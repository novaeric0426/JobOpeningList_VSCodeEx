// 확장 프로그램 기본 구조
import * as vscode from 'vscode';
import { fetchJobPostingHTML, parseJobPostingHTML } from './services/scraper';

// 채용공고 데이터 타입
interface JobPosting {
  id: string;
  company: string;
  title: string;
  registeredDate: string;
  url: string;
}

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
      vscode.env.openExternal(vscode.Uri.parse(url));
    })
  );

  // 채용공고 새로고침 명령 등록
  context.subscriptions.push(
    vscode.commands.registerCommand('jobCrawler.refreshJobs', async () => {
      jobPostingsProvider.resetJobs();
      // 실제로는 여기서 크롤링을 수행하고 결과를 jobPostingsProvider에 전달
      const htmlString = await fetchJobPostingHTML([16], 1);
      const result = parseJobPostingHTML(htmlString);

      vscode.window.showInformationMessage('채용공고 새로고침 중...');
      
      for (let i = 0; i < result.length; ++i) {
        jobPostingsProvider.addJob(result[i]);
      }
      jobPostingsProvider.refresh();
      vscode.window.showInformationMessage('채용공고가 업데이트되었습니다.');
    })
  );
}

// 확장 프로그램 비활성화 함수
export function deactivate() {}