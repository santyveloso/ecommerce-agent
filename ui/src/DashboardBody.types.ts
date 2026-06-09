import type { ToolProgress } from './useChatStream'
import type { Folder, ChatSession } from './types'
import type { MomMessage } from './useMomState'

/* ── DashboardBody Props ──────────────────────── */
export interface DashboardBodyProps {
  /* Layout / navigation */
  activeTab: string
  setActiveTab: (tab: string) => void
  sidebarCollapsed: boolean
  sidebarWidth: number
  sidebarRef: React.RefObject<HTMLDivElement | null>
  handleResizeStart: (e: React.MouseEvent) => void

  /* Theme */
  theme: string
  setTheme: (t: string) => void
  API: string

  /* Dashboard Metrics */
  dashboardData: any
  dashboardLoading: boolean
  period: string
  dateRange: { since: string; until: string } | null
  showDatePicker: boolean
  onShowDatePicker: (v: boolean) => void
  onChangePeriod: (p: string, since?: string, until?: string) => Promise<void>
  onRefresh: () => Promise<void>
  pickerRef: React.RefObject<HTMLDivElement | null>
  calScrollRef: React.RefObject<HTMLDivElement | null>
  calSince: string
  calUntil: string
  onCalSinceChange: (v: string) => void
  onCalUntilChange: (v: string) => void
  allMonths: { key: string; month: number; year: number }[]

  /* Status */
  statusData: any
  statusLoading: boolean
  fetchStatus: () => void

  /* Chat */
  sessions: ChatSession[]
  activeSessionId: string
  folders: Folder[]
  sessionSearchQuery: string
  onSessionSearchChange: (q: string) => void
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, name: string) => void
  onTogglePin: (id: string) => void
  onNewFolder: (name: string, color?: string) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onSetFolderColor: (folderId: string, color: string) => void
  onToggleFolder: (id: string) => void
  onMoveSession: (sessionId: string, folderId: string | null) => void
  chatEditingTitle: string | null
  onChatEditingTitleChange: (v: string | null) => void
  isStreaming: boolean
  streamError: string | null
  activeSession: ChatSession | undefined
  streamingContent: string
  currentTool: ToolProgress | null
  onCopyMessage: (content: string) => void
  copiedMessageId: string | null
  onEditMessage: (index: number, content: string) => void
  onRegenerate: (index: number) => void
  onDeleteMessage: (index: number) => void
  chatInputValue: string
  onChatInputChange: (val: string) => void
  onSendMessage: (content?: string) => Promise<void>
  onStopStreaming: () => void
  showSuggestions: boolean
  suggestions: string[]
  suggestionTriggerIdx: number
  activeSuggestionIdx: number
  onShowSuggestionsChange: (v: boolean) => void
  onInsertSuggestion: (name: string) => void
  onSetSuggestions: (v: string[]) => void
  onSetTriggerIdx: (v: number) => void
  onSetActiveSuggestionIdx: (v: number) => void
  studioUploads: any
  gatewayActiveModel: string
  availableModels: string[]
  onActiveModelChange: (m: string) => void
  dashboardStoreName: string | undefined
  onSessionsUpdate: (s: ChatSession[]) => void
  onGatewayActiveModelChange: (m: string) => void

  /* Orders */
  orders: any[]
  ordersLoading: boolean
  ordersSearch: string
  onOrdersSearchChange: (q: string) => void
  dateFrom: string
  onDateFromChange: (d: string) => void
  dateTo: string
  onDateToChange: (d: string) => void
  payFilter: string
  onPayFilterChange: (f: string) => void
  fulFilter: string
  onFulFilterChange: (f: string) => void
  selectedOrderName: string | null
  orderDetail: any
  orderDetailLoading: boolean
  onFetchOrders: () => void
  onSelectOrder: (name: string) => void
  onCloseOrderPanel: () => void
  onTalkToHermes: (name: string) => void

  /* Emails */
  emails: any[]
  emailsLoading: boolean
  selectedEmail: any
  emailThread: any[]
  emailThreadLoading: boolean
  emailActionLoading: boolean
  onRefreshEmails: () => void
  onViewEmail: (id: string) => void
  onBackToList: () => void
  onIgnoreEmail: (id: string) => void
  onArchiveEmail: (id: string) => void

  /* Studio */
  cardSize: number
  onCardSizeChange: (s: number) => void
  generatedImages: any[]
  onClearImages: () => void
  modalImage: any
  onModalImageChange: (img: any) => void
  studioInput: string
  onStudioInputValueChange: (v: string) => void
  studioLoading: boolean
  selectedImage: any
  studioShowSuggestions: boolean
  studioSuggestions: string[]
  studioActiveSuggestionIdx: number
  onStudioSend: () => void
  onStudioInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onInsertStudioSuggestion: (name: string) => void
  onStudioInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void

  /* Automations */
  automations: any[]
  automationsLoading: boolean
  showCreateModal: boolean
  onShowCreateModal: (v: boolean) => void
  newAutoName: string
  onNewAutoNameChange: (v: string) => void
  newAutoSchedule: string
  onNewAutoScheduleChange: (v: string) => void
  newAutoPrompt: string
  onNewAutoPromptChange: (v: string) => void
  newAutoSkills: string[]
  onNewAutoSkillsChange: (v: string[]) => void
  newAutoDeliver: string
  onNewAutoDeliverChange: (v: string) => void
  creating: boolean
  onCreateAutomation: () => void
  onPauseAutomation: (id: string) => void
  onResumeAutomation: (id: string) => void
  onRunAutomationNow: (id: string) => void
  onDeleteAutomation: (id: string) => void
  autoActionLoading: string
  expandedJobId: string | null
  onSetExpandedJobId: (id: string | null) => void

  /* Memory */
  memoryEntries: any[]
  memoryLoading: boolean
  newMemory: string
  onNewMemoryChange: (v: string) => void
  onAddMemory: () => void
  selectedMemoryFile: string | null
  onLoadMemoryFile: (path: string) => void
  memoryFileLoading: boolean
  memoryFileContent: string
  memoryEditMode: boolean
  onSetMemoryEditMode: (v: boolean) => void
  memoryEditContent: string
  onMemoryEditContentChange: (v: string) => void
  memorySaving: boolean
  onSaveMemoryFile: () => void

  /* Links */
  links: any[]
  showAddLink: boolean
  newLinkName: string
  newLinkUrl: string
  shopifyUrl: string
  displayLinks: any[]
  setShowAddLink: (v: boolean) => void
  setNewLinkName: (v: string) => void
  setNewLinkUrl: (v: string) => void
  setShopifyUrl: (v: string) => void
  addLink: () => void
  deleteLink: (id: string) => void

  /* Mom */
  momMessages: MomMessage[]
  momLoading: boolean
  momSending: boolean
  momUnreadCount: number
  onMomSendMessage: (text: string) => Promise<boolean>
}
