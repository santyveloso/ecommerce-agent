import { useState, useEffect } from 'react'
import { useSidebarResize } from './useSidebarResize'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { useChatState } from './useChatState'
import { useDashboardMetrics } from './useDashboardMetrics'
import { useStudioAutocomplete } from './useStudioAutocomplete'
import { useStudioState } from './useStudioState'
import { useOrdersState } from './useOrdersState'
import { useEmailsState } from './useEmailsState'
import { useMemoryState } from './useMemoryState'
import { useAutomationsState } from './useAutomationsState'
import { useLinksState } from './useLinksState'
import { useMomState } from './useMomState'
import { useGatewayModels } from './useGatewayModels'
import { useStatusData } from './useStatusData'
import DashboardBody from './DashboardBody'
import { API } from './constants'
import './revenue-chart.css'
import './dashboard.css'
import './chat.css'

/* ── Dashboard ──────────────────────────────── */
export default function Dashboard() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ec_theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('ec_default_tab') || 'dashboard'
  })
  const {
    sidebarCollapsed,
    sidebarWidth,
    sidebarRef,
    handleResizeStart,
    setSidebarCollapsed,
    setSidebarWidth,
  } = useSidebarResize()
  const {
    availableModels,
    gatewayActiveModel,
    setGatewayActiveModel,
    setActiveModel,
  } = useGatewayModels()

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ec_theme', theme)
  }, [theme])

  // ── Dashboard Metrics (useDashboardMetrics) ─
  const {
    dashboardData, dashboardLoading,
    period, dateRange, showDatePicker,
    setShowDatePicker, setDateRange,
    changePeriod, handleRefresh,
    pickerRef, calScrollRef,
    calSince, setCalSince, calUntil, setCalUntil,
    allMonths,
  } = useDashboardMetrics()

  const {
    statusData,
    statusLoading,
    fetchStatus,
  } = useStatusData(activeTab)

  // ── Chat State (extracted to useChatState) ─
  const {
    sessions, setSessions,
    activeSessionId, setActiveSessionId,
    folders,
    sessionSearchQuery, setSessionSearchQuery,
    chatInputValue, setChatInputValue,
    chatEditingTitle, setChatEditingTitle,
    copiedMessageId,
    showSuggestions, setShowSuggestions,
    suggestions, setSuggestions,
    suggestionTriggerIdx, setSuggestionTriggerIdx,
    activeSuggestionIdx, setActiveSuggestionIdx,
    isStreaming, streamError, stopStreaming,
    streamingContent, currentTool,
    activeSession,
    createNewSession, deleteSession, renameSession, togglePin,
    newFolder, renameFolder, deleteFolder, setFolderColor, toggleFolder, moveSession,
    handleSendMessage, handleCopyMessage, handleEditMessage, handleRegenerate, handleDeleteMessage,
    handleChatInputChange, insertSuggestion,
  } = useChatState(gatewayActiveModel)

  useKeyboardShortcuts(createNewSession, isStreaming, stopStreaming)

  // ── Studio State ────────────────────────
  const {
    generatedImages, setGeneratedImages,
    studioInput, setStudioInput,
    studioLoading,
    selectedImage, setSelectedImage,
    demoMode, setDemoMode,
    cardSize, setCardSize,
    modalImage, setModalImage,
    studioUploads,
    handleStudioSend, deleteAsset,
  } = useStudioState()

  // ── Orders Tab ──────────────────────────
  const {
    orders, setOrders,
    ordersLoading,
    ordersSearch, setOrdersSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    payFilter, setPayFilter,
    fulFilter, setFulFilter,
    fetchOrders,
    selectedOrderName, setSelectedOrderName,
    orderDetail, setOrderDetail,
    orderDetailLoading,
    fetchOrderDetail,
    closeOrderPanel,
    talkToHermes,
  } = useOrdersState(activeTab, setChatInputValue, setActiveTab)

  // ── Emails Tab ──────────────────────────
  const {
    emails, setEmails,
    emailsLoading,
    selectedEmail, setSelectedEmail,
    emailDetailLoading,
    emailThread, setEmailThread,
    emailThreadLoading,
    actionLoading,
    viewEmail, viewThread,
    ignoreEmail, archiveEmail,
    refreshEmails, backToList,
  } = useEmailsState(activeTab)

  // ── Memory Tab ──────────────────────────
  const {
    memoryEntries, setMemoryEntries,
    memoryLoading,
    newMemory, setNewMemory,
    addMemory,
    selectedMemoryFile, setSelectedMemoryFile,
    memoryFileContent,
    memoryFileLoading,
    memoryEditMode, setMemoryEditMode,
    memoryEditContent, setMemoryEditContent,
    memorySaving,
    loadMemoryFile, saveMemoryFile,
  } = useMemoryState(activeTab)

  // ── Links Tab ───────────────────────────
  const {
    links, setLinks,
    showAddLink, setShowAddLink,
    newLinkName, setNewLinkName,
    newLinkUrl, setNewLinkUrl,
    shopifyUrl, setShopifyUrl,
    displayLinks,
    addLink, deleteLink,
  } = useLinksState()

  // ── Mom Tab ──────────────────────────────
  const {
    messages: momMessages,
    loading: momLoading,
    sending: momSending,
    unreadCount: momUnreadCount,
    sendMessage: momSendMessage,
  } = useMomState(activeTab)

  // ── Automations Tab ─────────────────────
  const {
    automations, setAutomations,
    automationsLoading,
    showCreateModal, setShowCreateModal,
    newAutoName, setNewAutoName,
    newAutoSchedule, setNewAutoSchedule,
    newAutoPrompt, setNewAutoPrompt,
    newAutoSkills, setNewAutoSkills,
    newAutoDeliver, setNewAutoDeliver,
    creating,
    autoActionLoading,
    expandedJobId, setExpandedJobId,
    pauseAutomation, resumeAutomation,
    deleteAutomation, runAutomationNow,
    createAutomation,
  } = useAutomationsState(activeTab)

  // ── Studio @mention autocomplete ──────────
  const {
    studioSuggestions,
    studioShowSuggestions,
    studioSuggestionTriggerIdx,
    studioActiveSuggestionIdx,
    onShowSuggestionsChange: setStudioShowSuggestions,
    onSetSuggestions: setStudioSuggestions,
    onSetTriggerIdx: setStudioSuggestionTriggerIdx,
    onSetActiveSuggestionIdx: setStudioActiveSuggestionIdx,
    handleStudioInputChange: _handleStudioInputChange,
    insertStudioSuggestion: _insertStudioSuggestion,
    handleStudioInputKeyDown: _handleStudioInputKeyDown,
  } = useStudioAutocomplete(studioUploads)

  const handleStudioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => _handleStudioInputChange(e, setStudioInput)
  const insertStudioSuggestion = (name: string) => _insertStudioSuggestion(name, studioInput, setStudioInput)
  const handleStudioInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => _handleStudioInputKeyDown(e, (n) => _insertStudioSuggestion(n, studioInput, setStudioInput))

  // ── Render ──────────────────────────────
  return (
    <DashboardBody
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      sidebarCollapsed={sidebarCollapsed}
      sidebarWidth={sidebarWidth}
      sidebarRef={sidebarRef}
      handleResizeStart={handleResizeStart}
      theme={theme}
      setTheme={setTheme}
      API={API}
      dashboardData={dashboardData}
      dashboardLoading={dashboardLoading}
      period={period}
      dateRange={dateRange}
      showDatePicker={showDatePicker}
      onShowDatePicker={setShowDatePicker}
      onChangePeriod={changePeriod}
      onRefresh={handleRefresh}
      pickerRef={pickerRef}
      calScrollRef={calScrollRef}
      calSince={calSince}
      calUntil={calUntil}
      onCalSinceChange={setCalSince}
      onCalUntilChange={setCalUntil}
      allMonths={allMonths}
      statusData={statusData}
      statusLoading={statusLoading}
      fetchStatus={fetchStatus}
      sessions={sessions}
      setSessions={setSessions}
      activeSessionId={activeSessionId}
      folders={folders}
      sessionSearchQuery={sessionSearchQuery}
      onSessionSearchChange={setSessionSearchQuery}
      onSelectSession={setActiveSessionId}
      onNewSession={createNewSession}
      onDeleteSession={deleteSession}
      onRenameSession={renameSession}
      onTogglePin={togglePin}
      onNewFolder={newFolder}
      onRenameFolder={renameFolder}
      onDeleteFolder={deleteFolder}
      onSetFolderColor={setFolderColor}
      onToggleFolder={toggleFolder}
      onMoveSession={moveSession}
      chatEditingTitle={chatEditingTitle}
      onChatEditingTitleChange={setChatEditingTitle}
      isStreaming={isStreaming}
      streamError={streamError}
      activeSession={activeSession}
      streamingContent={streamingContent}
      currentTool={currentTool}
      onCopyMessage={handleCopyMessage}
      copiedMessageId={copiedMessageId}
      onEditMessage={handleEditMessage}
      onRegenerate={handleRegenerate}
      onDeleteMessage={handleDeleteMessage}
      chatInputValue={chatInputValue}
      onChatInputChange={handleChatInputChange}
      onSendMessage={handleSendMessage}
      onStopStreaming={stopStreaming}
      showSuggestions={showSuggestions}
      suggestions={suggestions}
      suggestionTriggerIdx={suggestionTriggerIdx}
      activeSuggestionIdx={activeSuggestionIdx}
      onShowSuggestionsChange={setShowSuggestions}
      onInsertSuggestion={insertSuggestion}
      onSetSuggestions={setSuggestions}
      onSetTriggerIdx={setSuggestionTriggerIdx}
      onSetActiveSuggestionIdx={setActiveSuggestionIdx}
      studioUploads={studioUploads}
      gatewayActiveModel={gatewayActiveModel}
      availableModels={availableModels}
      onActiveModelChange={setGatewayActiveModel}
      dashboardStoreName={dashboardData?.storeName}
      onSessionsUpdate={setSessions}
      onGatewayActiveModelChange={setGatewayActiveModel}
      orders={orders}
      ordersLoading={ordersLoading}
      ordersSearch={ordersSearch}
      onOrdersSearchChange={setOrdersSearch}
      dateFrom={dateFrom}
      onDateFromChange={setDateFrom}
      dateTo={dateTo}
      onDateToChange={setDateTo}
      payFilter={payFilter}
      onPayFilterChange={setPayFilter}
      fulFilter={fulFilter}
      onFulFilterChange={setFulFilter}
      selectedOrderName={selectedOrderName}
      orderDetail={orderDetail}
      orderDetailLoading={orderDetailLoading}
      onFetchOrders={fetchOrders}
      onSelectOrder={(name) => { setSelectedOrderName(name); fetchOrderDetail(name) }}
      onCloseOrderPanel={closeOrderPanel}
      onTalkToHermes={talkToHermes}
      emails={emails}
      emailsLoading={emailsLoading}
      selectedEmail={selectedEmail}
      emailThread={emailThread}
      emailThreadLoading={emailThreadLoading}
      emailActionLoading={actionLoading}
      onRefreshEmails={refreshEmails}
      onViewEmail={viewEmail}
      onBackToList={backToList}
      onIgnoreEmail={ignoreEmail}
      onArchiveEmail={archiveEmail}
      cardSize={cardSize}
      onCardSizeChange={setCardSize}
      generatedImages={generatedImages}
      onClearImages={() => setGeneratedImages([])}
      modalImage={modalImage}
      onModalImageChange={setModalImage}
      studioInput={studioInput}
      onStudioInputValueChange={setStudioInput}
      studioLoading={studioLoading}
      selectedImage={selectedImage}
      studioShowSuggestions={studioShowSuggestions}
      studioSuggestions={studioSuggestions}
      studioActiveSuggestionIdx={studioActiveSuggestionIdx}
      onStudioSend={handleStudioSend}
      onStudioInputChange={handleStudioInputChange}
      onInsertStudioSuggestion={insertStudioSuggestion}
      onStudioInputKeyDown={handleStudioInputKeyDown}
      automations={automations}
      automationsLoading={automationsLoading}
      showCreateModal={showCreateModal}
      onShowCreateModal={setShowCreateModal}
      newAutoName={newAutoName}
      onNewAutoNameChange={setNewAutoName}
      newAutoSchedule={newAutoSchedule}
      onNewAutoScheduleChange={setNewAutoSchedule}
      newAutoPrompt={newAutoPrompt}
      onNewAutoPromptChange={setNewAutoPrompt}
      newAutoSkills={newAutoSkills}
      onNewAutoSkillsChange={setNewAutoSkills}
      newAutoDeliver={newAutoDeliver}
      onNewAutoDeliverChange={setNewAutoDeliver}
      creating={creating}
      onCreateAutomation={createAutomation}
      onPauseAutomation={pauseAutomation}
      onResumeAutomation={resumeAutomation}
      onRunAutomationNow={runAutomationNow}
      onDeleteAutomation={deleteAutomation}
      autoActionLoading={autoActionLoading}
      expandedJobId={expandedJobId}
      onSetExpandedJobId={setExpandedJobId}
      memoryEntries={memoryEntries}
      memoryLoading={memoryLoading}
      newMemory={newMemory}
      onNewMemoryChange={setNewMemory}
      onAddMemory={addMemory}
      selectedMemoryFile={selectedMemoryFile}
      onLoadMemoryFile={loadMemoryFile}
      memoryFileLoading={memoryFileLoading}
      memoryFileContent={memoryFileContent}
      memoryEditMode={memoryEditMode}
      onSetMemoryEditMode={setMemoryEditMode}
      memoryEditContent={memoryEditContent}
      onMemoryEditContentChange={setMemoryEditContent}
      memorySaving={memorySaving}
      onSaveMemoryFile={saveMemoryFile}
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
      addLink={addLink}
      deleteLink={deleteLink}
      momMessages={momMessages}
      momLoading={momLoading}
      momSending={momSending}
      momUnreadCount={momUnreadCount}
      onMomSendMessage={momSendMessage}
    />
  )
}
