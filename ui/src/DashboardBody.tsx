import type { ToolProgress } from './useChatStream'
import type { Folder, ChatSession } from './types'
import DashboardContent from './DashboardContent'
import ChatPanel from './ChatPanel'
import OrdersPanel from './OrdersPanel'
import EmailsPanel from './EmailsPanel'
import StudioPanel from './StudioPanel'
import AutomationsPanel from './AutomationsPanel'
import MemoryPanel from './MemoryPanel'
import StatusTab from './StatusTab'
import LinksTab from './LinksTab'
import SettingsPanel from './SettingsPanel'
import Sidebar from './Sidebar'

/* ── Props ──────────────────────────────── */
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
}

/* ── Component ──────────────────────────── */
export default function DashboardBody(props: DashboardBodyProps) {
  const {
    activeTab, setActiveTab,
    sidebarCollapsed, sidebarWidth, sidebarRef, handleResizeStart,
    theme, setTheme, API,
    dashboardData, dashboardLoading, period, dateRange,
    showDatePicker, onShowDatePicker, onChangePeriod, onRefresh,
    pickerRef, calScrollRef, calSince, calUntil,
    onCalSinceChange, onCalUntilChange, allMonths,
    statusData, statusLoading, fetchStatus,
    sessions, activeSessionId, folders, sessionSearchQuery,
    onSessionSearchChange, onSelectSession,
    onNewSession, onDeleteSession, onRenameSession, onTogglePin,
    onNewFolder, onRenameFolder, onDeleteFolder, onSetFolderColor,
    onToggleFolder, onMoveSession,
    chatEditingTitle, onChatEditingTitleChange,
    isStreaming, streamError, activeSession, streamingContent, currentTool,
    onCopyMessage, copiedMessageId, onEditMessage, onRegenerate, onDeleteMessage,
    chatInputValue, onChatInputChange, onSendMessage, onStopStreaming,
    showSuggestions, suggestions, suggestionTriggerIdx, activeSuggestionIdx,
    onShowSuggestionsChange, onInsertSuggestion,
    onSetSuggestions, onSetTriggerIdx, onSetActiveSuggestionIdx,
    studioUploads, gatewayActiveModel, availableModels,
    onActiveModelChange, dashboardStoreName, onSessionsUpdate, onGatewayActiveModelChange,
    orders, ordersLoading, ordersSearch, onOrdersSearchChange,
    dateFrom, onDateFromChange, dateTo, onDateToChange,
    payFilter, onPayFilterChange, fulFilter, onFulFilterChange,
    selectedOrderName, orderDetail, orderDetailLoading,
    onFetchOrders, onSelectOrder, onCloseOrderPanel, onTalkToHermes,
    emails, emailsLoading, selectedEmail, emailThread, emailThreadLoading,
    emailActionLoading, onRefreshEmails, onViewEmail, onBackToList,
    onIgnoreEmail, onArchiveEmail,
    cardSize, onCardSizeChange, generatedImages, onClearImages,
    modalImage, onModalImageChange, studioInput, onStudioInputValueChange,
    studioLoading, selectedImage, studioShowSuggestions, studioSuggestions,
    studioActiveSuggestionIdx, onStudioSend, onStudioInputChange,
    onInsertStudioSuggestion, onStudioInputKeyDown,
    automations, automationsLoading, showCreateModal, onShowCreateModal,
    newAutoName, onNewAutoNameChange, newAutoSchedule, onNewAutoScheduleChange,
    newAutoPrompt, onNewAutoPromptChange, newAutoSkills, onNewAutoSkillsChange,
    newAutoDeliver, onNewAutoDeliverChange, creating, onCreateAutomation,
    onPauseAutomation, onResumeAutomation, onRunAutomationNow, onDeleteAutomation,
    actionLoading: autoActionLoading, expandedJobId, onSetExpandedJobId,
    memoryEntries, memoryLoading, newMemory, onNewMemoryChange, onAddMemory,
    selectedMemoryFile, onLoadMemoryFile, memoryFileLoading, memoryFileContent,
    memoryEditMode, onSetMemoryEditMode, memoryEditContent,
    onMemoryEditContentChange, memorySaving, onSaveMemoryFile,
    links, showAddLink, newLinkName, newLinkUrl, shopifyUrl, displayLinks,
    setShowAddLink, setNewLinkName, setNewLinkUrl, setShopifyUrl,
    addLink: addLinkFn, deleteLink,
  } = props

  return (
    <div className="app">
      {/* ── Sidebar ─────────────────────── */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        sidebarWidth={sidebarWidth}
        sidebarRef={sidebarRef}
        handleResizeStart={handleResizeStart}
      />

      {/* ── Main Content ────────────────── */}
      <div className="main" style={{ padding: '0' }}>
        {activeTab === 'dashboard' && (
          <DashboardContent
            dashboardData={dashboardData}
            dashboardLoading={dashboardLoading}
            period={period}
            dateRange={dateRange}
            showDatePicker={showDatePicker}
            onShowDatePicker={onShowDatePicker}
            onChangePeriod={onChangePeriod}
            onRefresh={onRefresh}
            pickerRef={pickerRef}
            calScrollRef={calScrollRef}
            calSince={calSince}
            calUntil={calUntil}
            onCalSinceChange={onCalSinceChange}
            onCalUntilChange={onCalUntilChange}
            allMonths={allMonths}
          />
        )}

        {activeTab === 'chat' && (
          <ChatPanel
            sessions={sessions}
            activeSessionId={activeSessionId}
            folders={folders}
            sessionSearchQuery={sessionSearchQuery}
            onSessionSearchChange={onSessionSearchChange}
            onSelectSession={onSelectSession}
            onNewSession={onNewSession}
            onDeleteSession={onDeleteSession}
            onRenameSession={onRenameSession}
            onTogglePin={onTogglePin}
            onNewFolder={onNewFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onSetFolderColor={onSetFolderColor}
            onToggleFolder={onToggleFolder}
            onMoveSession={onMoveSession}
            chatEditingTitle={chatEditingTitle}
            onChatEditingTitleChange={onChatEditingTitleChange}
            isStreaming={isStreaming}
            streamError={streamError}
            activeSession={activeSession}
            streamingContent={streamingContent}
            currentTool={currentTool}
            onCopyMessage={onCopyMessage}
            copiedMessageId={copiedMessageId}
            onEditMessage={onEditMessage}
            onRegenerate={onRegenerate}
            onDeleteMessage={onDeleteMessage}
            chatInputValue={chatInputValue}
            onChatInputChange={onChatInputChange}
            onSendMessage={onSendMessage}
            onStopStreaming={onStopStreaming}
            showSuggestions={showSuggestions}
            suggestions={suggestions}
            suggestionTriggerIdx={suggestionTriggerIdx}
            activeSuggestionIdx={activeSuggestionIdx}
            onShowSuggestionsChange={onShowSuggestionsChange}
            onInsertSuggestion={onInsertSuggestion}
            onSetSuggestions={onSetSuggestions}
            onSetTriggerIdx={onSetTriggerIdx}
            onSetActiveSuggestionIdx={onSetActiveSuggestionIdx}
            studioUploads={studioUploads}
            gatewayActiveModel={gatewayActiveModel}
            availableModels={availableModels}
            onActiveModelChange={onActiveModelChange}
            dashboardStoreName={dashboardStoreName}
            onSessionsUpdate={onSessionsUpdate}
            onGatewayActiveModelChange={onGatewayActiveModelChange}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersPanel
            orders={orders}
            ordersLoading={ordersLoading}
            ordersSearch={ordersSearch}
            onOrdersSearchChange={onOrdersSearchChange}
            dateFrom={dateFrom}
            onDateFromChange={onDateFromChange}
            dateTo={dateTo}
            onDateToChange={onDateToChange}
            payFilter={payFilter}
            onPayFilterChange={onPayFilterChange}
            fulFilter={fulFilter}
            onFulFilterChange={onFulFilterChange}
            selectedOrderName={selectedOrderName}
            orderDetail={orderDetail}
            orderDetailLoading={orderDetailLoading}
            onFetchOrders={onFetchOrders}
            onSelectOrder={onSelectOrder}
            onCloseOrderPanel={onCloseOrderPanel}
            onTalkToHermes={onTalkToHermes}
          />
        )}

        {activeTab === 'emails' && (
          <EmailsPanel
            emails={emails}
            emailsLoading={emailsLoading}
            selectedEmail={selectedEmail}
            emailThread={emailThread}
            emailThreadLoading={emailThreadLoading}
            actionLoading={emailActionLoading}
            onRefreshEmails={onRefreshEmails}
            onViewEmail={onViewEmail}
            onBackToList={onBackToList}
            onIgnoreEmail={onIgnoreEmail}
            onArchiveEmail={onArchiveEmail}
          />
        )}

        {activeTab === 'studio' && (
          <StudioPanel
            cardSize={cardSize}
            onCardSizeChange={onCardSizeChange}
            generatedImages={generatedImages}
            onClearImages={onClearImages}
            modalImage={modalImage}
            onModalImageChange={onModalImageChange}
            studioInput={studioInput}
            onStudioInputValueChange={onStudioInputValueChange}
            studioLoading={studioLoading}
            selectedImage={selectedImage}
            studioUploads={studioUploads}
            studioShowSuggestions={studioShowSuggestions}
            studioSuggestions={studioSuggestions}
            studioActiveSuggestionIdx={studioActiveSuggestionIdx}
            onStudioSend={onStudioSend}
            onStudioInputChange={onStudioInputChange}
            onInsertStudioSuggestion={onInsertStudioSuggestion}
            onStudioInputKeyDown={onStudioInputKeyDown}
          />
        )}

        {activeTab === 'automations' && (
          <AutomationsPanel
            automations={automations}
            automationsLoading={automationsLoading}
            showCreateModal={showCreateModal}
            onShowCreateModal={onShowCreateModal}
            newAutoName={newAutoName}
            onNewAutoNameChange={onNewAutoNameChange}
            newAutoSchedule={newAutoSchedule}
            onNewAutoScheduleChange={onNewAutoScheduleChange}
            newAutoPrompt={newAutoPrompt}
            onNewAutoPromptChange={onNewAutoPromptChange}
            newAutoSkills={newAutoSkills}
            onNewAutoSkillsChange={onNewAutoSkillsChange}
            newAutoDeliver={newAutoDeliver}
            onNewAutoDeliverChange={onNewAutoDeliverChange}
            creating={creating}
            onCreateAutomation={onCreateAutomation}
            onPauseAutomation={onPauseAutomation}
            onResumeAutomation={onResumeAutomation}
            onRunAutomationNow={onRunAutomationNow}
            onDeleteAutomation={onDeleteAutomation}
            actionLoading={autoActionLoading}
            expandedJobId={expandedJobId}
            onSetExpandedJobId={onSetExpandedJobId}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryPanel
            memoryEntries={memoryEntries}
            memoryLoading={memoryLoading}
            newMemory={newMemory}
            onNewMemoryChange={onNewMemoryChange}
            onAddMemory={onAddMemory}
            selectedMemoryFile={selectedMemoryFile}
            onLoadMemoryFile={onLoadMemoryFile}
            memoryFileLoading={memoryFileLoading}
            memoryFileContent={memoryFileContent}
            memoryEditMode={memoryEditMode}
            onSetMemoryEditMode={onSetMemoryEditMode}
            memoryEditContent={memoryEditContent}
            onMemoryEditContentChange={onMemoryEditContentChange}
            memorySaving={memorySaving}
            onSaveMemoryFile={onSaveMemoryFile}
          />
        )}

        {activeTab === 'status' && (
          <StatusTab
            statusData={statusData}
            statusLoading={statusLoading}
            fetchStatus={fetchStatus}
          />
        )}

        {activeTab === 'links' && (
          <LinksTab
            links={links}
            showAddLink={showAddLink}
            newLinkName={newLinkName}
            newLinkUrl={newLinkUrl}
            shopifyUrl={shopifyUrl}
            displayLinks={displayLinks}
            setShowAddLink={setShowAddLink}
            setNewLinkName={setNewLinkName}
            setNewLinkUrl={setNewLinkUrl}
            setShopifyUrl={setShopifyUrl}
            addLink={addLinkFn}
            deleteLink={deleteLink}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            API={API}
            theme={theme}
            setTheme={setTheme}
          />
        )}
      </div>
    </div>
  )
}
