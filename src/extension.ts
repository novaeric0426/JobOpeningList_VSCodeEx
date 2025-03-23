// 확장 프로그램 기본 구조
import * as vscode from 'vscode';

// 모의 채용공고 데이터
interface JobPosting {
  id: string;
  company: string;
  title: string;
  date: string;
  url: string;
}

// 샘플 채용 데이터
const sampleJobs: JobPosting[] = [
  { id: '1', company: '네이버', title: '프론트엔드 개발자', date: '2025-03-22', url: 'https://example.com/job1' },
  { id: '2', company: '카카오', title: '백엔드 개발자', date: '2025-03-21', url: 'https://example.com/job2' },
  { id: '3', company: '라인', title: '풀스택 개발자', date: '2025-03-20', url: 'https://example.com/job3' },
  { id: '4', company: '쿠팡', title: '데이터 엔지니어', date: '2025-03-19', url: 'https://example.com/job4' },
  { id: '5', company: '토스', title: '시스템 엔지니어', date: '2025-03-18', url: 'https://example.com/job5' },
];

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
}

// 채용공고 아이템 클래스
class JobItem extends vscode.TreeItem {
  constructor(
    public readonly job: JobPosting
  ) {
    super(`${job.company}: ${job.title}`, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${job.title} at ${job.company} (${job.date})`;
    this.description = job.date;
    this.command = {
      command: 'jobCrawler.openJobURL',
      title: 'Open Job URL',
      arguments: [job.url]
    };
    this.contextValue = 'jobPosting';
  }
}

// 확장 프로그램 활성화 함수
export function activate(context: vscode.ExtensionContext) {
  console.log('채용공고 크롤러 확장 프로그램이 활성화되었습니다.');

  // 채용공고 제공자 생성
  const jobPostingsProvider = new JobPostingsProvider(sampleJobs);
  
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
    vscode.commands.registerCommand('jobCrawler.refreshJobs', () => {
      // 실제로는 여기서 크롤링을 수행하고 결과를 jobPostingsProvider에 전달
      vscode.window.showInformationMessage('채용공고 새로고침 중...');
      
      // 모의 데이터 추가 (크롤링 로직으로 대체 예정)
      const newJob: JobPosting = {
        id: `${Date.now()}`,
        company: '신규 회사',
        title: '신규 포지션',
        date: new Date().toISOString().split('T')[0],
        url: 'https://example.com/new-job'
      };
      
      jobPostingsProvider.addJob(newJob);
      jobPostingsProvider.refresh();
      vscode.window.showInformationMessage('채용공고가 업데이트되었습니다.');
    })
  );
}

// 확장 프로그램 비활성화 함수
export function deactivate() {}