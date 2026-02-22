export const helpArticles = [
  // Getting Started
  {
    slug: 'what-is-rfe-ready',
    title: 'What is RFE Ready?',
    category: 'Getting Started',
    content: `RFE Ready is an AI-powered platform that helps immigration attorneys respond to Requests for Evidence (RFEs) from USCIS. The platform streamlines the process of analyzing RFE notices, drafting responses, and managing case deadlines.\n\nKey features include:\n- **Case Management** — Track all your RFE cases with statuses, deadlines, and visa types\n- **AI Analysis** — Upload RFE notices and get automated analysis of the issues raised\n- **Draft Responses** — Generate AI-powered draft responses using your knowledge base\n- **Knowledge Base** — Store legal memos, templates, and reference documents\n- **Team Collaboration** — Invite attorneys, paralegals, and staff to work together`,
  },
  {
    slug: 'creating-your-first-case',
    title: 'Creating Your First Case',
    category: 'Getting Started',
    content: `To create a new RFE case:\n\n1. Navigate to **Cases** from the sidebar\n2. Click the **New Case** button\n3. Fill in the required fields:\n   - **Case Number** — Your internal reference or USCIS receipt number\n   - **Petitioner Name** — The name of the petitioner\n   - **Beneficiary Name** — The name of the beneficiary\n   - **Visa Type** — Select the visa category (H-1B, L-1, O-1, EB-1, etc.)\n4. Optionally set the **RFE Deadline** and add any **Notes**\n5. Click **Create Case**\n\nAfter creating the case, you can upload the RFE notice document and start the AI analysis.`,
  },
  {
    slug: 'navigating-the-app',
    title: 'Navigating the Application',
    category: 'Getting Started',
    content: `The app has a sidebar navigation with the following sections:\n\n- **Dashboard** — Overview of your cases, charts, and recent activity\n- **Cases** — List and manage all your RFE cases\n- **Knowledge Base** — Upload and manage reference documents\n\nFor administrators:\n- **Settings** — Firm and subscription settings\n- **Users** — Manage team members and roles\n- **Audit Log** — View all activity across the organization\n\nYour profile, dark mode toggle, and sign-out are at the bottom of the sidebar.`,
  },

  // Cases
  {
    slug: 'case-statuses',
    title: 'Understanding Case Statuses',
    category: 'Cases',
    content: `Each case progresses through several statuses:\n\n- **Draft** — Case has been created but the RFE notice hasn't been analyzed yet\n- **In Review** — The case is being reviewed by an attorney\n- **Analyzing** — The AI is currently analyzing the RFE notice\n- **Responded** — The RFE response has been finalized and submitted\n- **Archived** — The case is closed and stored for reference\n\nYou can update the status from the case detail page using the status dropdown.`,
  },
  {
    slug: 'uploading-rfe-notice',
    title: 'Uploading an RFE Notice',
    category: 'Cases',
    content: `To upload an RFE notice document:\n\n1. Open the case from the **Cases** list\n2. In the **RFE Notice** section, click **Upload** or drag and drop your file\n3. Supported formats: PDF, DOCX, DOC, TXT\n4. Maximum file size: 25MB\n\nOnce uploaded, you can trigger the AI analysis to identify the key issues raised in the RFE.`,
  },
  {
    slug: 'generating-draft-response',
    title: 'Generating AI Draft Responses',
    category: 'Cases',
    content: `After the RFE notice has been analyzed:\n\n1. Open the case detail page\n2. Navigate to the **Draft Response** tab\n3. Click **Generate Draft** to create an AI-powered response\n4. The AI uses:\n   - The RFE notice analysis\n   - Your knowledge base documents\n   - Case-specific information\n5. Review the draft, make edits, and finalize\n\nYou can generate multiple draft versions and compare them. Each draft is saved automatically.`,
  },
  {
    slug: 'case-deadlines',
    title: 'Managing Deadlines',
    category: 'Cases',
    content: `RFE deadlines are critical. The platform helps you track them:\n\n- Set the **RFE Deadline** when creating or editing a case\n- The **Dashboard** shows a count of cases with approaching deadlines (within 7 days)\n- **Deadline indicators** appear in case lists with color coding:\n  - Green: More than 14 days remaining\n  - Yellow: 7-14 days remaining\n  - Red: Less than 7 days remaining\n  - Gray (overdue): Past the deadline\n\nEnable deadline notifications in your **Profile > Preferences** to receive email reminders.`,
  },

  // Knowledge Base
  {
    slug: 'knowledge-base-overview',
    title: 'Knowledge Base Overview',
    category: 'Knowledge Base',
    content: `The Knowledge Base stores documents that the AI uses to generate better draft responses. Document types include:\n\n- **Legal Memo** — Internal legal analysis and research memos\n- **Template** — Standard response templates and boilerplate language\n- **Regulation** — Relevant regulations and policy guidance\n- **Case Law** — Relevant case decisions and precedents\n- **Other** — Any other reference material\n\nDocuments can be tagged with a visa type so the AI can find the most relevant material for each case.`,
  },
  {
    slug: 'uploading-documents',
    title: 'Uploading Knowledge Documents',
    category: 'Knowledge Base',
    content: `To add a document to the Knowledge Base:\n\n1. Navigate to **Knowledge Base** from the sidebar\n2. Click **Upload Document**\n3. Fill in the details:\n   - **Title** — A descriptive title for the document\n   - **Document Type** — Select the type (Legal Memo, Template, etc.)\n   - **Visa Type** — Optionally associate with a visa category\n   - **Content** — Paste text content, or upload a file\n4. Click **Save**\n\nUploaded documents are automatically processed and embedded for AI retrieval. The embedding status is shown with a badge on each document.`,
  },

  // Drafts
  {
    slug: 'editing-drafts',
    title: 'Editing Draft Responses',
    category: 'Drafts',
    content: `When working with AI-generated drafts:\n\n- Click on the draft text to start editing inline\n- Changes are **auto-saved** as you type (after a brief pause)\n- The save indicator shows when changes are being saved\n- You can manually save at any time with the Save button\n- Use the **Version History** to compare different draft versions\n\nDraft responses support rich text with headings, lists, and emphasis to help structure your response.`,
  },
  {
    slug: 'exporting-drafts',
    title: 'Exporting Draft Responses',
    category: 'Drafts',
    content: `To export a finalized draft response:\n\n1. Open the case and navigate to the draft\n2. Click the **Export** button\n3. Choose your format:\n   - **PDF** — Formatted document ready for filing\n   - **DOCX** — Editable Word document\n4. The exported document includes the case header information and the full response text\n\nExported documents can be further edited in your word processor before filing.`,
  },

  // Admin
  {
    slug: 'managing-users',
    title: 'Managing Team Members',
    category: 'Admin',
    content: `Administrators can manage team members from the **Users** page:\n\n- **Invite Users** — Send email invitations to new team members\n- **Roles** — Assign roles:\n  - **Admin** — Full access including settings and user management\n  - **Attorney** — Case management and draft review\n  - **Paralegal** — Case support and document management\n  - **Viewer** — Read-only access to cases\n- **Deactivate/Activate** — Temporarily disable or re-enable user accounts\n- **Bulk Actions** — Select multiple users to activate or deactivate at once`,
  },
  {
    slug: 'audit-log',
    title: 'Using the Audit Log',
    category: 'Admin',
    content: `The Audit Log tracks all significant actions across your organization:\n\n- **Filter by action** — View only creates, updates, or deletes\n- **Filter by type** — Focus on cases, documents, users, or drafts\n- **Export** — Download the audit log as CSV or PDF for compliance\n\nEach entry shows who performed the action, what was changed, and when. The audit log is read-only and cannot be modified.`,
  },
]

export const helpCategories = ['Getting Started', 'Cases', 'Knowledge Base', 'Drafts', 'Admin']
