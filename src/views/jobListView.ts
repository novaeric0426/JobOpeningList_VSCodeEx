import * as vscode from 'vscode';

export class JobListView {
    private panel: vscode.WebviewPanel | undefined;
    private jobs: Array<{ title: string; company: string; location: string; link: string }> = [];

    constructor() {
        this.createPanel();
    }

    private createPanel() {
        this.panel = vscode.window.createWebviewPanel(
            'jobListView',
            'Job Listings',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        this.refresh();
    }

    public refresh() {
        // Here you would typically call a method from the Crawler service to fetch job listings
        this.jobs = this.fetchJobListings(); // Placeholder for actual job fetching logic
        this.updateView();
    }

    private fetchJobListings() {
        // This method should interact with the Crawler service to get the job listings
        return [
            { title: 'Software Engineer', company: 'Company A', location: 'Remote', link: 'https://example.com/job1' },
            { title: 'Frontend Developer', company: 'Company B', location: 'On-site', link: 'https://example.com/job2' },
        ];
    }

    private updateView() {
        if (!this.panel) {
            return;
        }

        this.panel.webview.html = this.getHtmlForWebview(this.jobs);
    }

    private getHtmlForWebview(jobs: Array<{ title: string; company: string; location: string; link: string }>) {
        const jobItems = jobs.map(job => {
            return `<li>
                        <a href="${job.link}">${job.title}</a> at ${job.company} (${job.location})
                    </li>`;
        }).join('');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Job Listings</title>
        </head>
        <body>
            <h1>Job Listings</h1>
            <ul>
                ${jobItems}
            </ul>
        </body>
        </html>`;
    }
}