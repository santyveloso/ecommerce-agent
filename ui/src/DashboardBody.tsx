import type { ToolProgress } from './useChatStream'
import type { Folder, ChatSession } from './types'
import type { DashboardBodyProps } from './DashboardBody.types'
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
import MomPanel from './MomPanel'
import Sidebar from './Sidebar'

/* ── Props (imported from DashboardBody.types) ─ */

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
    momMessages, momLoading, momSending, momUnreadCount, onMomSendMessage,
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
        momUnreadCount={momUnreadCount}
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

        {activeTab === 'mom' && (
          <MomPanel
            messages={momMessages}
            loading={momLoading}
            sending={momSending}
            onSendMessage={onMomSendMessage}
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
