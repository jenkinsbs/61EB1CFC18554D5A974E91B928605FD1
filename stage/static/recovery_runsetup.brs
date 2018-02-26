REM
REM runsetup
REM Copyright (c) 2006-2015 BrightSign, LLC.
REM 

Sub Main()

    debugOn = true
    loggingOn = true
    
    ' DisplayDownloadMessage()
    
    diagnosticCodes = newDiagnosticCodes()

    RunSetup(debugOn, loggingOn, diagnosticCodes)

    Stop
    
End Sub


Sub RunSetup(debugOn As Boolean, loggingOn As Boolean, diagnosticCodes As Object)

    Setup = newSetup(debugOn, loggingOn)

    setupVersion$ = "4.4.0.1"
    print "setup script version ";setupVersion$;" started"

    modelObject = CreateObject("roDeviceInfo")
    sysInfo = CreateObject("roAssociativeArray")
    sysInfo.deviceUniqueID$ = modelObject.GetDeviceUniqueId()
    sysInfo.deviceFWVersion$ = modelObject.GetVersion()
    sysInfo.deviceModel$ = modelObject.GetModel()
    sysInfo.deviceFamily$ = modelObject.GetFamily()
    sysInfo.setupVersion$ = setupVersion$
    sysInfo.deviceFWVersionNumber% = modelObject.GetVersionNumber()
	' Proxy Bypass requires FW 6.0.59 or higher
	if sysInfo.deviceFWVersionNumber% >= 393275 then
		sysInfo.fwSupportsDecryption = true
    else
		sysInfo.fwSupportsDecryption = false
	endif

    ' create pool directory
    ok = CreateDirectory("pool")

    Setup.diagnosticCodes = diagnosticCodes
    
    Setup.SetSystemInfo(sysInfo, diagnosticCodes)

    Setup.networkingActive = Setup.networking.InitializeNetworkDownloads()

' initialize logging parameters

    registrySection = CreateObject("roRegistrySection", "networking")
    if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection" :stop

    diagnosticLoggingEnabled = false
    uploadLogFilesAtBoot = false
    uploadLogFilesAtSpecificTime = false
    uploadLogFilesTime% = 0

    if registrySection.Read("dle") = "yes" then diagnosticLoggingEnabled = true
    if registrySection.Read("uab") = "yes" then uploadLogFilesAtBoot = true
    if registrySection.Read("uat") = "yes" then uploadLogFilesAtSpecificTime = true
    uploadLogFilesTime$ = registrySection.Read("ut")
    if uploadLogFilesTime$ <> "" then uploadLogFilesTime% = int(val(uploadLogFilesTime$))
    
' setup logging
    Setup.logging.InitializeLogging(false, false, diagnosticLoggingEnabled, uploadLogFilesAtBoot, uploadLogFilesAtSpecificTime, uploadLogFilesTime%)
    
    Setup.logging.WriteDiagnosticLogEntry(diagnosticCodes.EVENT_STARTUP, sysInfo.deviceFWVersion$ + chr(9) + sysInfo.setupVersion$ + chr(9) + "")

    Setup.EventLoop()
    
    return

End Sub


Function newSetup(debugOn As Boolean, loggingOn As Boolean) As Object

    Setup = CreateObject("roAssociativeArray")

    Setup.debugOn = debugOn
    
    Setup.systemTime = CreateObject("roSystemTime")
    Setup.diagnostics = newDiagnostics(debugOn, loggingOn)

    Setup.msgPort = CreateObject("roMessagePort")

    Setup.gpioPort = CreateObject("roGpioControlPort")
    Setup.gpioPort.SetPort(Setup.msgPort)

    Setup.newLogging = newLogging
    Setup.logging = Setup.newLogging()
    Setup.newNetworking = newNetworking
    Setup.networking = Setup.newNetworking(Setup)    
    Setup.logging.networking = Setup.networking

    Setup.SetSystemInfo = SetupSetSystemInfo
    Setup.EventLoop = EventLoop

    return Setup

End Function
 

Sub SetupSetSystemInfo(sysInfo As Object, diagnosticCodes As Object)

    m.diagnostics.SetSystemInfo(sysInfo, diagnosticCodes)
    m.networking.SetSystemInfo(sysInfo, diagnosticCodes)
    m.networking.SetUserAgent(sysInfo)
    m.logging.SetSystemInfo(sysInfo, diagnosticCodes)
    
    return

End Sub


Sub EventLoop()

    while true
    
	    msg = wait(0, m.msgPort)
	    
	    if (type(msg) = "roUrlEvent") then
	    
            m.networking.URLEvent(msg)
		    
	    elseif (type(msg) = "roSyncPoolEvent") then
	    
            m.networking.PoolEvent(msg)
		    
	    elseif (type(msg) = "roTimerEvent") then
	    
            ' see if the timer is for Logging
            loggingTimeout = false
            if type(m.logging) = "roAssociativeArray" then
                if type(m.logging.cutoverTimer) = "roTimer" then
                    if msg.GetSourceIdentity() = m.logging.cutoverTimer.GetIdentity() then
                        ' indicate that event was for logging
                        m.logging.HandleTimerEvent(msg)
                        loggingTimeout = true
                    endif
                endif
            endif

            if not loggingTimeout then
    		    m.networking.StartSync()
	        endif
	        
	    elseif (type(msg) = "roSyncPoolProgressEvent") then
	    
	        m.networking.SyncPoolProgressEvent(msg)
	        
        elseif (type(msg) = "roGpioButton") then
            
            if msg.GetInt()=12 then
                stop
            endif

	    endif

    endwhile

    return

End Sub


REM *******************************************************
REM *******************************************************
REM ***************                    ********************
REM *************** DIAGNOSTICS OBJECT ********************
REM ***************                    ********************
REM *******************************************************
REM *******************************************************

REM
REM construct a new diagnostics BrightScript object
REM
Function newDiagnostics(debugOn As Boolean, loggingOn As Boolean) As Object

    diagnostics = CreateObject("roAssociativeArray")
    
    diagnostics.debug = debugOn
    diagnostics.logging = loggingOn
    diagnostics.setupVersion$ = "unknown"
    diagnostics.firmwareVersion$ = "unknown"
    diagnostics.systemTime = CreateObject("roSystemTime")
    
    diagnostics.PrintDebug = PrintDebug
    diagnostics.PrintTimestamp = PrintTimestamp
    diagnostics.OpenLogFile = OpenLogFile
    diagnostics.CloseLogFile = CloseLogFile
    diagnostics.OldFlushLogFile = OldFlushLogFile
    diagnostics.WriteToLog = WriteToLog
    diagnostics.SetSystemInfo = DiagnosticsSetSystemInfo
    diagnostics.RotateLogFiles = RotateLogFiles
    diagnostics.TurnDebugOn = TurnDebugOn
    
    diagnostics.OpenLogFile()

    return diagnostics

End Function


Sub TurnDebugOn()

    m.debug = true
    
    return
    
End Sub


Sub DiagnosticsSetSystemInfo(sysInfo As Object, diagnosticCodes As Object)

    m.setupVersion$ = sysInfo.setupVersion$
    m.deviceFWVersion$ = sysInfo.deviceFWVersion$
    m.deviceUniqueID$ = sysInfo.deviceUniqueID$
    m.deviceModel$ = sysInfo.deviceModel$
    m.deviceFamily$ = sysInfo.deviceFamily$
    m.deviceFWVersionNumber% = sysInfo.deviceFWVersionNumber%
    
    m.diagnosticCodes = diagnosticCodes
    return

End Sub


Sub OpenLogFile()

    m.logFile = 0

    if not m.logging then return

    m.logFileLength = 0

    m.logFile = CreateObject("roReadFile", "log.txt")
    if type(m.logFile) = "roReadFile" then
        m.logFile.SeekToEnd()
        m.logFileLength = m.logFile.CurrentPosition()
        m.logFile = 0
    endif

    m.logFile = CreateObject("roAppendFile", "log.txt")
    if type(m.logFile)<>"roAppendFile" then
        print "unable to open log.txt"
        stop
    endif

    return

End Sub


Sub CloseLogFile()

    if not m.logging then return

    m.logFile.Flush()
    m.logFile = 0

    return

End Sub


Sub OldFlushLogFile()

    if not m.logging then return

    if m.logFileLength > 1000000 then
        print  "### - Rotate Log Files - ###"
        m.logFile.SendLine("### - Rotate Log Files - ###")
    endif

    m.logFile.Flush()

    if m.logFileLength > 1000000 then
        m.RotateLogFiles()
    endif

    return

End Sub


Sub WriteToLog(eventType$ As String, eventData$ As String, eventResponseCode$ As String, accountName$ As String)

    if not m.logging then return

    if m.debug then print "### write_event"

    ' write out the following info
    '   Timestamp, Device ID, Account Name, Event Type, Event Data, Response Code, Software Version, Firmware Version
    eventDateTime = m.systemTime.GetLocalDateTime()
    eventDataStr$ = eventDateTime + " " + accountName$ + " " + eventType$ + " " + eventData$ + " " + eventResponseCode$ + " recovery_runsetup.brs " + m.setupVersion$ + " " + m.deviceFWVersion$
    if m.debug then print "eventDataStr$ = ";eventDataStr$
    m.logFile.SendLine(eventDataStr$)

    m.logFileLength = m.logFileLength + len(eventDataStr$) + 14

    m.OldFlushLogFile()

    return

End Sub


Sub RotateLogFiles()

    log3 = CreateObject("roReadFile", "log_3.txt")
    if type(log3)="roReadFile" then
        log3 = 0
		DeleteFile("log_3.txt")
    endif

    log2 = CreateObject("roReadFile", "log_2.txt")
    if type(log2)="roReadFile" then
        log2 = 0
        MoveFile("log_2.txt", "log_3.txt")
    endif

    m.logFile = 0
    MoveFile("log.txt", "log_2.txt")

    m.OpenLogFile()

    return

End Sub


Sub PrintDebug(debugStr$ As String)

    if type(m) <> "roAssociativeArray" then stop
    
    if m.debug then 

        print debugStr$

        if not m.logging then return

        m.logFile.SendLine(debugStr$)
        m.logFileLength = m.logFileLength + len(debugStr$) + 1
        m.OldFlushLogFile()

    endif

    return

End Sub


Sub PrintTimestamp()

    eventDateTime = m.systemTime.GetLocalDateTime()
    if m.debug then print eventDateTime.GetString()
    if not m.logging then return
    m.logFile.SendLine(eventDateTime)
    m.OldFlushLogFile()

    return

End Sub



REM *******************************************************
REM *******************************************************
REM ***************                    ********************
REM *************** NETWORKING OBJECT  ********************
REM ***************                    ********************
REM *******************************************************
REM *******************************************************

REM
REM construct a new networking BrightScript object
REM
Function newNetworking(Setup As Object) As Object

    networking = CreateObject("roAssociativeArray")

    networking.systemTime = m.systemTime
    networking.diagnostics = m.diagnostics
    networking.logging = m.logging
    networking.msgPort = m.msgPort

    networking.InitializeNetworkDownloads = InitializeNetworkDownloads
    networking.StartSync = StartSync
    networking.URLEvent = URLEvent
    networking.PoolEvent = PoolEvent
    networking.SyncPoolProgressEvent = SyncPoolProgressEvent
    networking.GetPoolFilePath = GetPoolFilePath
    
    networking.SendDeviceError = SendDeviceError
    networking.SendEvent = SendEvent
    networking.SendEventCommon = SendEventCommon
    networking.SendEventThenReboot = SendEventThenReboot
    networking.WaitForTransfersToComplete = WaitForTransfersToComplete
    networking.SetSystemInfo = NetworkingSetSystemInfo
    networking.SetUserAgent = NetworkingSetUserAgent
    
    networking.GetURL = GetURL
    networking.GetRegistryValue = GetRegistryValue
    
    networking.URLDeviceDownloadXferEvent = URLDeviceDownloadXferEvent
    networking.DeviceDownloadItems = CreateObject("roArray", 8, true)
    networking.AddDeviceDownloadItem = AddDeviceDownloadItem
    networking.UploadDeviceDownload = UploadDeviceDownload
    networking.deviceDownloadUploadURL = CreateObject("roUrlTransfer")

    networking.deviceErrorURL = CreateObject("roUrlTransfer")
    networking.deviceErrorURL.SetMinimumTransferRate(1,500)

    networking.URLDeviceDownloadProgressXferEvent = URLDeviceDownloadProgressXferEvent
    networking.DeviceDownloadProgressItems = CreateObject("roAssociativeArray")
    networking.DeviceDownloadProgressItemsPendingUpload = CreateObject("roAssociativeArray")
    networking.AddDeviceDownloadProgressItem = AddDeviceDownloadProgressItem
	networking.PushDeviceDownloadProgressItem = PushDeviceDownloadProgressItem
    networking.UploadDeviceDownloadProgressItems = UploadDeviceDownloadProgressItems
    networking.UploadDeviceDownloadProgressFileList = UploadDeviceDownloadProgressFileList
    networking.deviceDownloadProgressUploadURL = CreateObject("roUrlTransfer")
	networking.BuildFileDownloadList = BuildFileDownloadList

    networking.URLTrafficDownloadXferEvent = URLTrafficDownloadXferEvent
    networking.UploadTrafficDownload = UploadTrafficDownload
    networking.trafficDownloadUploadURL = CreateObject("roUrlTransfer")
    networking.trafficDownloadUploadURL.SetMinimumTransferRate(1,500)
    networking.trafficUploadComplete = false

    networking.AddUploadHeaders = AddUploadHeaders

' logging
    networking.UploadLogFiles = UploadLogFiles
    networking.UploadLogFileHandler = UploadLogFileHandler
    networking.uploadLogFileURLXfer = CreateObject("roUrlTransfer")
    networking.uploadLogFileURLXfer.SetPort(networking.msgPort)
    networking.uploadLogFileURLXfer.SetMinimumTransferRate(1,500)
    networking.uploadLogFileURL$ = ""
    networking.uploadLogFolder = "logs"
    networking.uploadLogArchiveFolder = "archivedLogs"
    networking.uploadLogFailedFolder = "failedLogs"
    networking.enableLogDeletion = true

    networking.POOL_EVENT_FILE_DOWNLOADED = 1
    networking.POOL_EVENT_FILE_FAILED = -1
    networking.POOL_EVENT_ALL_DOWNLOADED = 2
    networking.POOL_EVENT_ALL_FAILED = -2

    networking.SYNC_ERROR_CANCELLED = -10001
    networking.SYNC_ERROR_CHECKSUM_MISMATCH = -10002
    networking.SYNC_ERROR_EXCEPTION = -10003
    networking.SYNC_ERROR_DISK_ERROR = -10004
    networking.SYNC_ERROR_POOL_UNSATISFIED = -10005

    networking.EVENT_REALIZE_SUCCESS = 101

    networking.URL_EVENT_COMPLETE = 1

	du = CreateObject("roStorageInfo", "./")
    networking.cardSizeInMB = du.GetSizeInMegabytes()
    du = 0

    return networking

End Function


Function InitializeNetworkDownloads() As Boolean

    m.diagnostics.PrintTimestamp()
	m.diagnostics.PrintDebug("### Checking validity of system time")
    while not m.systemTime.IsValid()
    	m.diagnostics.PrintDebug("### System time invalid - try again in 30 seconds")
    	sleep(30000)
        m.diagnostics.PrintTimestamp()
    endwhile
    m.diagnostics.PrintDebug("### System time valid")
    
    ' Read information from the registry
    registrySection = CreateObject("roRegistrySection", "networking")
    if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection" :stop
    
    ' determine whether this is a setup operation (versus a recovery operation)
    m.setup = false
    value$ = registrySection.Read("su")
    if value$ = "yes" then m.setup = true 
    
    m.account$ = m.GetRegistryValue(registrySection, "a", "account")
    if m.account$ = "" then     m.diagnostics.PrintDebug("Error: account not set in registry") :stop
    m.bsnrt$ = m.GetRegistryValue(registrySection, "bsnrt", "bsnrt")
    m.user$ = m.GetRegistryValue(registrySection, "u", "user")
    m.password$ = m.GetRegistryValue(registrySection, "p", "password")
    if m.bsnrt$ = "" and m.user$ = "" and m.password$ = "" then m.diagnostics.PrintDebug("Error: authentication not set in registry") : stop

    m.group$ = m.GetRegistryValue(registrySection, "g", "group")
    if m.group$ = "" then m.diagnostics.PrintDebug("Error: group not set in registry") :stop
    m.timezone$ = m.GetRegistryValue(registrySection, "tz", "timezone")
    if m.timezone$ = "" then m.diagnostics.PrintDebug("Error: timezone not set in registry") :stop
    m.unitName$ = m.GetRegistryValue(registrySection, "un", "unitName")
    m.unitNamingMethod$ = m.GetRegistryValue(registrySection, "unm", "unitNamingMethod")
    if m.unitNamingMethod$ = "" then m.diagnostics.PrintDebug("Error: unitNamingMethod not set in registry") :stop
    m.unitDescription$ = m.GetRegistryValue(registrySection, "ud", "unitDescription")
    
	m.timeBetweenNetConnects$ = m.GetRegistryValue(registrySection, "tbnc", "timeBetweenNetConnects")
    if m.timeBetweenNetConnects$ = "" then m.diagnostics.PrintDebug("Error: timeBetweenNetConnects not set in registry") :stop
	m.contentDownloadsRestricted$ = m.GetRegistryValue(registrySection, "cdr", "contentDownloadsRestricted")
    if m.contentDownloadsRestricted$ = "" then m.diagnostics.PrintDebug("Error: contentDownloadsRestricted not set in registry") :stop
    if m.contentDownloadsRestricted$ = "yes" then
        m.contentDownloadRangeStart$ = m.GetRegistryValue(registrySection, "cdrs", "contentDownloadRangeStart")
        if m.contentDownloadRangeStart$ = "" then m.diagnostics.PrintDebug("Error: contentDownloadRangeStart not set in registry") :stop
        m.contentDownloadRangeLength$ = m.GetRegistryValue(registrySection, "cdrl", "contentDownloadRangeLength")
        if m.contentDownloadRangeLength$ = "" then m.diagnostics.PrintDebug("Error: contentDownloadRangeLength not set in registry") :stop
    endif
    
	' heartbeat registry values aren't set in older versions - introduced in BA 3.4
	m.timeBetweenHeartbeats$ = m.GetRegistryValue(registrySection, "tbh", "tbh")
    if m.timeBetweenHeartbeats$ = "" then
'		m.diagnostics.PrintDebug("Error: timeBetweenHeartbeats not set in registry")
		m.timeBetweenHeartbeats$ = "900"
	endif

	m.heartbeatsRestricted$ = m.GetRegistryValue(registrySection, "hr", "hr")
    if m.heartbeatsRestricted$ = "" then 
'		m.diagnostics.PrintDebug("Error: heartbeatsRestricted not set in registry")
		m.heartbeatsRestricted$ = "no"
	endif
    if m.heartbeatsRestricted$ = "yes" then
        m.heartbeatsRangeStart$ = m.GetRegistryValue(registrySection, "hrs", "hrs")
        if m.heartbeatsRangeStart$ = "" then m.diagnostics.PrintDebug("Error: heartbeatsRangeStart not set in registry") :stop
        m.heartbeatsRangeLength$ = m.GetRegistryValue(registrySection, "hrl", "hrl")
        if m.heartbeatsRangeLength$ = "" then m.diagnostics.PrintDebug("Error: heartbeatsRangeLength not set in registry") :stop
    endif
    
    ' diagnostic web server parameters
    m.dwsEnabled$ = m.GetRegistryValue(registrySection, "dwse", "dwse")
    m.dwsPassword$ = m.GetRegistryValue(registrySection, "dwsp", "dwsp")
	
	' local web server parameters
	m.lwsConfig$ = m.GetRegistryValue(registrySection, "nlws", "nlws")
	if not m.lwsConfig$ = "" then
		if m.lwsConfig$ = "c" then m.lwsConfig$ = "content"
		if m.lwsConfig$ = "s" then m.lwsConfig$ = "status"
		m.lwsUserName$ = m.GetRegistryValue(registrySection, "nlwsu", "nlwsu")
		m.lwsPassword$ = m.GetRegistryValue(registrySection, "nlwsp", "nlwsp")
		m.lwsEnableUpdateNotifications$ = m.GetRegistryValue(registrySection, "nlwseun", "nlwseun")
	else
		m.lwsConfig$ = "none"
	endif
	
	' custom splash screen content id
	m.splashScreenContentId$ = m.GetRegistryValue(registrySection, "csid", "csid")
	
	' idle screen color
	m.idleScreenColor$ = m.GetRegistryValue(registrySection, "isc", "isc")
    
    ' logging parameters
    m.playbackLoggingEnabled$ = m.GetRegistryValue(registrySection, "ple", "ple")
    if m.playbackLoggingEnabled$ = "" then m.playbackLoggingEnabled$ = "no"
    m.eventLoggingEnabled$ = m.GetRegistryValue(registrySection, "ele", "ele")
    if m.eventLoggingEnabled$ = "" then m.eventLoggingEnabled$ = "no"
    m.diagnosticLoggingEnabled$ = m.GetRegistryValue(registrySection, "dle", "dle")
    if m.diagnosticLoggingEnabled$ = "" then m.diagnosticLoggingEnabled$ = "no"
    m.stateLoggingEnabled$ = m.GetRegistryValue(registrySection, "sle", "sle")
    if m.stateLoggingEnabled$ = "" then m.stateLoggingEnabled$ = "no"
    m.variableLoggingEnabled$ = m.GetRegistryValue(registrySection, "vle", "vle")
    if m.variableLoggingEnabled$ = "" then m.variableLoggingEnabled$ = "no"
    m.uploadLogFilesAtBoot$ = m.GetRegistryValue(registrySection, "uab", "uab")
    if m.uploadLogFilesAtBoot$ = "" then m.uploadLogFilesAtBoot$ = "no"
    m.uploadLogFilesAtSpecificTime$ = m.GetRegistryValue(registrySection, "uat", "uat")
    if m.uploadLogFilesAtSpecificTime$ = "" then m.uploadLogFilesAtSpecificTime$ = "no"
    m.uploadLogFilesTime$ = m.GetRegistryValue(registrySection, "ut", "ut")
    if m.uploadLogFilesTime$ = "" then m.uploadLogFilesTime$ = "0"
    
    ' network host options
	m.hostname$ = m.GetRegistryValue(registrySection, "hn", "hn" )
	m.useProxy = m.GetRegistryValue(registrySection, "up", "up")
	if m.useProxy = "yes" then
		m.proxy$ = m.GetRegistryValue(registrySection, "ps", "ps")
	else
		m.proxy$ = ""
	endif

	' Proxy bypass host names

	m.proxyBypassHostnames$ = ""
	m.bypassProxyHosts = []
	networkHosts$ = m.GetRegistryValue(registrySection, "bph", "bph")
	if networkHosts$ <> "" then
		networkHosts = ParseJSON(networkHosts$)
		for each networkHost in networkHosts
			if networkHost.BypassProxy then
				hostName$ = networkHost.HostName
				if hostName$ <> "" then
					m.bypassProxyHosts.push(hostName$)
					if m.proxyBypassHostnames$ = "" then
						m.proxyBypassHostnames$ = hostName$
					else
						m.proxyBypassHostnames$ = m.proxyBypassHostnames$ + ";" + hostName$
					endif
				endif
			endif
		next
	endif

    m.beacon1Json$ = m.GetRegistryValue(registrySection, "beacon1", "beacon1")
    m.beacon2Json$ = m.GetRegistryValue(registrySection, "beacon2", "beacon2")

    m.timeServer$ = m.GetRegistryValue(registrySection, "ts", "timeServer")
    print "time server in recovery_runsetup_ba.brs as read from registry = ";m.timeServer$

	' remote snapshot parameters
    m.deviceScreenShotsEnabled$ = m.GetRegistryValue(registrySection, "enableRemoteSnapshot", "enableRemoteSnapshot")
    m.deviceScreenShotsInterval$ = m.GetRegistryValue(registrySection, "remoteSnapshotInterval", "remoteSnapshotInterval")
	m.deviceScreenShotsCountLimit$ = m.GetRegistryValue(registrySection, "remoteSnapshotMaxImages", "remoteSnapshotMaxImages")
	m.deviceScreenShotsQuality$ = m.GetRegistryValue(registrySection, "remoteSnapshotJpegQualityLevel", "remoteSnapshotJpegQualityLevel")
	m.deviceScreenShotsDisplayPortrait$ = m.GetRegistryValue(registrySection, "remoteSnapshotDisplayPortrait", "remoteSnapshotDisplayPortrait")

	' BrightWall parameters
	m.brightWallName$ = m.GetRegistryValue(registrySection, "brightWallName", "brightWallName")
	m.brightWallScreenNumber$ = m.GetRegistryValue(registrySection, "brightWallScreenNumber", "brightWallScreenNumber")

	' first network configuration

	' networking parameters
    m.useDHCP$ = m.GetRegistryValue(registrySection, "dhcp", "useDHCP")
    if m.useDHCP$ = "" then m.diagnostics.PrintDebug("Error: useDHCP not set in registry") :stop
    if m.useDHCP$ = "no" then
        m.staticIPAddress$ = m.GetRegistryValue(registrySection, "sip", "staticIPAddress")
        if m.staticIPAddress$ = "" then m.diagnostics.PrintDebug("Error: staticIPAddress not set in registry") :stop
        m.subnetMask$ = m.GetRegistryValue(registrySection, "sm", "subnetMask")
        if m.subnetMask$ = "" then m.diagnostics.PrintDebug("Error: subnetMask not set in registry") :stop
        m.gateway$ = m.GetRegistryValue(registrySection, "gw", "gateway")
        if m.gateway$ = "" then m.diagnostics.PrintDebug("Error: gateway not set in registry") :stop
        m.broadcast$ = m.GetRegistryValue(registrySection, "bc", "broadcast")
        ' if m.broadcast$ = "" then m.diagnostics.PrintDebug("Error: broadcast not set in registry") :stop
        m.dns1$ = m.GetRegistryValue(registrySection, "d1", "dns1")
        m.dns2$ = m.GetRegistryValue(registrySection, "d2", "dns2")
        m.dns3$ = m.GetRegistryValue(registrySection, "d3", "dns3")
    endif

    ' rate limit parameters
    m.rateLimitModeOutsideWindow$ = m.GetRegistryValue(registrySection, "rlmow", "rlmow")
    m.rateLimitRateOutsideWindow$ = m.GetRegistryValue(registrySection, "rlrow", "rlrow")
    m.rateLimitModeInWindow$ = m.GetRegistryValue(registrySection, "rlmiw", "rlmiw")
    m.rateLimitRateInWindow$ = m.GetRegistryValue(registrySection, "rlriw", "rlriw")
    m.rateLimitModeInitialDownloads$ = m.GetRegistryValue(registrySection, "rlmid", "rlmid")
    m.rateLimitRateInitialDownloads$ = m.GetRegistryValue(registrySection, "rlrid", "rlrid")

	' second network configuration

	' networking parameters
    m.useDHCP_2$ = m.GetRegistryValue(registrySection, "dhcp2", "useDHCP")
    if m.useDHCP_2$ = "" then
'		m.diagnostics.PrintDebug("Error: useDHCP_2 not set in registry")
		m.useDHCP_2$ = "yes"
	endif

    if m.useDHCP_2$ = "no" then
        m.staticIPAddress_2$ = m.GetRegistryValue(registrySection, "sip2", "staticIPAddress")
        if m.staticIPAddress_2$ = "" then m.diagnostics.PrintDebug("Error: staticIPAddress not set in registry") :stop
        m.subnetMask_2$ = m.GetRegistryValue(registrySection, "sm2", "subnetMask")
        if m.subnetMask_2$ = "" then m.diagnostics.PrintDebug("Error: subnetMask not set in registry") :stop
        m.gateway_2$ = m.GetRegistryValue(registrySection, "gw2", "gateway")
        if m.gateway_2$ = "" then m.diagnostics.PrintDebug("Error: gateway not set in registry") :stop
        ' m.broadcast_2$ = m.GetRegistryValue(registrySection, "bc", "broadcast")
        ' if m.broadcast_2$ = "" then m.diagnostics.PrintDebug("Error: broadcast not set in registry") :stop
        m.dns1_2$ = m.GetRegistryValue(registrySection, "d12", "dns1")
        m.dns2_2$ = m.GetRegistryValue(registrySection, "d22", "dns2")
        m.dns3_2$ = m.GetRegistryValue(registrySection, "d32", "dns3")
    endif

    ' rate limit parameters
    m.rateLimitModeOutsideWindow_2$ = m.GetRegistryValue(registrySection, "rlmow2", "rlmow2")
	if m.rateLimitModeOutsideWindow_2$ = "" then m.rateLimitModeInitialDownloads_2$ = "default"
    m.rateLimitRateOutsideWindow_2$ = m.GetRegistryValue(registrySection, "rlrow2", "rlrow2")
	if m.rateLimitRateOutsideWindow_2$ = "" then m.rateLimitRateOutsideWindow_2$ = "0"
    m.rateLimitModeInWindow_2$ = m.GetRegistryValue(registrySection, "rlmiw2", "rlmiw2")
	if m.rateLimitModeInWindow_2$ = "" then m.rateLimitModeInitialDownloads_2$ = "default"
    m.rateLimitRateInWindow_2$ = m.GetRegistryValue(registrySection, "rlriw2", "rlriw2")
	if m.rateLimitRateInWindow_2$ = "" then m.rateLimitRateInWindow_2$ = "0"
    m.rateLimitModeInitialDownloads_2$ = m.GetRegistryValue(registrySection, "rlmid2", "rlmid2")
	if m.rateLimitModeInitialDownloads_2$ = "" then m.rateLimitModeInitialDownloads_2$ = "default"
    m.rateLimitRateInitialDownloads_2$ = m.GetRegistryValue(registrySection, "rlrid2", "rlrid2")
	if m.rateLimitRateInitialDownloads_2$ = "" then m.rateLimitRateInitialDownloads_2$ = "0"

    m.useWireless = m.GetRegistryValue(registrySection, "wifi", "wifi")
    if m.useWireless = "yes" then
        m.ssid$ = m.GetRegistryValue(registrySection, "ss", "ss")
        if m.ssid$ = "" then m.diagnostics.PrintDebug("Error: ssid not set in registry") :stop
        m.passphrase$ = m.GetRegistryValue(registrySection, "pp", "pp")
    endif

	' wired parameters
	m.networkConnectionPriorityWired$ = m.GetRegistryValue(registrySection, "ncp", "ncp")
	if m.networkConnectionPriorityWired$ = "" then m.networkConnectionPriorityWired$ = "0"
	m.contentXfersEnabledWired = m.GetRegistryValue(registrySection, "cwr", "cwr")
	if m.contentXfersEnabledWired$ = "" then m.contentXfersEnabledWired$ = "True"
	m.textFeedsXfersEnabledWired = m.GetRegistryValue(registrySection, "twr", "twr")
	if m.textFeedsXfersEnabledWired$ = "" then m.textFeedsXfersEnabledWired$ = "True"
	m.healthXfersEnabledWired = m.GetRegistryValue(registrySection, "hwr", "hwr")
	if m.healthXfersEnabledWired$ = "" then m.healthXfersEnabledWired$ = "True"
	m.mediaFeedsXfersEnabledWired = m.GetRegistryValue(registrySection, "mwr", "mwr")
	if m.mediaFeedsXfersEnabledWired$ = "" then m.mediaFeedsXfersEnabledWired$ = "True"
	m.logUploadsXfersEnabledWired = m.GetRegistryValue(registrySection, "lwr", "lwr")
	if m.logUploadsXfersEnabledWired$ = "" then m.logUploadsXfersEnabledWired$ = "True"

	' wireless parameters
	m.networkConnectionPriorityWireless$ = m.GetRegistryValue(registrySection, "ncp2", "ncp2")
	if m.networkConnectionPriorityWireless$ = "" then m.networkConnectionPriorityWireless$ = "0"
	m.contentXfersEnabledWireless = m.GetRegistryValue(registrySection, "cwf", "cwf")
	if m.contentXfersEnabledWireless$ = "" then m.contentXfersEnabledWireless$ = "True"
	m.textFeedsXfersEnabledWireless = m.GetRegistryValue(registrySection, "twf", "twf")
	if m.textFeedsXfersEnabledWireless$ = "" then m.textFeedsXfersEnabledWireless$ = "True"
	m.healthXfersEnabledWireless = m.GetRegistryValue(registrySection, "hwf", "hwf")
	if m.healthXfersEnabledWireless$ = "" then m.healthXfersEnabledWireless$ = "True"
	m.mediaFeedsXfersEnabledWireless = m.GetRegistryValue(registrySection, "mwf", "mwf")
	if m.mediaFeedsXfersEnabledWireless$ = "" then m.mediaFeedsXfersEnabledWireless$ = "True"
	m.logUploadsXfersEnabledWireless = m.GetRegistryValue(registrySection, "lwf", "lwf")
	if m.logUploadsXfersEnabledWireless$ = "" then m.logUploadsXfersEnabledWireless$ = "True"

' determine whether or not setRoutingMetric is supported
	m.multipleNetworkInterfaceFunctionsExist = false
	index% = instr(1, m.deviceFWVersion$, ".")
	if index% >= 2 then
		major$ = left(m.deviceFWVersion$, index% - 1)
		if major$ = "1" or major$ = "2" then
			m.multipleNetworkInterfaceFunctionsExist = false
		else if major$ = "3" or major$ = "4" then
			' 3.10.12 / 4.2.36
			if (major$ = "3" and m.deviceFWVersionNumber% >= 199180) or (major$ = "4" and m.deviceFWVersionNumber% >= 262692) then
				m.multipleNetworkInterfaceFunctionsExist = true
			endif
		else
			m.multipleNetworkInterfaceFunctionsExist = true
		endif		
	endif

' configure ethernet
	nc = CreateObject("roNetworkConfiguration", 0)
	if type(nc) = "roNetworkConfiguration" then

		if m.useWireless = "yes" then

			if m.useDHCP_2$ = "no" then
				nc.SetIP4Address(m.staticIPAddress_2$)
				nc.SetIP4Netmask(m.subnetMask_2$)
				if m.broadcast$ <> invalid then
					nc.SetIP4Broadcast(m.broadcast$) ' there is no m.broadcast_2$
				endif
				nc.SetIP4Gateway(m.gateway_2$)
				if m.dns1_2$ <> "" then nc.AddDNSServer(m.dns1_2$)
				if m.dns2_2$ <> "" then nc.AddDNSServer(m.dns2_2$)
				if m.dns3_2$ <> "" then nc.AddDNSServer(m.dns3_2$)
			else
				nc.SetDHCP()
			endif

			rl% = -1
			if m.rateLimitModeInitialDownloads_2$ = "unlimited" then
				rl% = 0
			else if m.rateLimitModeInitialDownloads_2$ = "specified" then
				rl% = int(val(m.rateLimitRateInitialDownloads_2$))
			endif

		else

			if m.useDHCP$ = "no" then
				nc.SetIP4Address(m.staticIPAddress$)
				nc.SetIP4Netmask(m.subnetMask$)
		        nc.SetIP4Broadcast(m.broadcast$)
				nc.SetIP4Gateway(m.gateway$)
				if m.dns1$ <> "" then nc.AddDNSServer(m.dns1$)
				if m.dns2$ <> "" then nc.AddDNSServer(m.dns2$)
				if m.dns3$ <> "" then nc.AddDNSServer(m.dns3$)
			else
				nc.SetDHCP()
			endif

			rl% = -1
			if m.rateLimitModeInitialDownloads$ = "unlimited" then
				rl% = 0
			else if m.rateLimitModeInitialDownloads$ = "specified" then
				rl% = int(val(m.rateLimitRateInitialDownloads$))
			endif

		endif

		if m.multipleNetworkInterfaceFunctionsExist then
			nc.SetRoutingMetric(int(val(m.networkConnectionPriorityWired$)))
		endif

		nc.SetTimeServer(m.timeServer$)
		nc.SetProxy(m.proxy$)

		' Proxy Bypass requires FW 5.2.28 or higher
		if m.deviceFWVersionNumber% >= 328220 then
			nc.SetProxyBypass(m.bypassProxyHosts)
		endif

		' version number 3.7.44  - 198444
		if m.deviceFWVersionNumber% >= 198444 then
			' set rate limit
			print "SetInboundShaperRate to ";rl%
			ok = nc.SetInboundShaperRate(rl%)
			if not ok then print "Failure calling SetInboundShaperRate with parameter ";rl%
		endif  

		success = nc.Apply()
	else
		print "Unable to create roNetworkConfiguration - index = 0"
	endif


' configure wifi if specified and device supports wifi
	if m.useWireless = "yes" then
		nc = CreateObject("roNetworkConfiguration", 1)
		if type(nc) = "roNetworkConfiguration" then

			nc.SetWiFiESSID(m.ssid$)
			nc.SetObfuscatedWifiPassphrase(m.passphrase$)

			if m.useDHCP$ = "no" then
				nc.SetIP4Address(m.staticIPAddress$)
				nc.SetIP4Netmask(m.subnetMask$)
				nc.SetIP4Broadcast(m.broadcast$)
				nc.SetIP4Gateway(m.gateway$)
				if m.dns1$ <> "" then nc.AddDNSServer(m.dns1$)
				if m.dns2$ <> "" then nc.AddDNSServer(m.dns2$)
				if m.dns3$ <> "" then nc.AddDNSServer(m.dns3$)
			else
				nc.SetDHCP()
			endif

			if m.multipleNetworkInterfaceFunctionsExist then
				nc.SetRoutingMetric(int(val(m.networkConnectionPriorityWireless$)))
			endif

			nc.SetTimeServer(m.timeServer$)
			nc.SetProxy(m.proxy$)

			' Proxy Bypass requires FW 5.2.28 or higher
			if m.deviceFWVersionNumber% >= 328220 then
				nc.SetProxyBypass(m.bypassProxyHosts)
			endif

			' version number 3.7.44  - 198444
			if m.deviceFWVersionNumber% >= 198444 then
				' set rate limit
				rl% = -1
				if m.rateLimitModeInitialDownloads$ = "unlimited" then
					rl% = 0
				else if m.rateLimitModeInitialDownloads$ = "specified" then
					rl% = int(val(m.rateLimitRateInitialDownloads$))
				endif
				print "SetInboundShaperRate to ";rl%
				ok = nc.SetInboundShaperRate(rl%)
				if not ok then print "Failure calling SetInboundShaperRate with parameter ";rl%
			endif  

			success = nc.Apply()
		else
			print "Unable to create roNetworkConfiguration - index = 1"
		endif
	endif

	contentXfersEnabledWired = GetDataTransferEnabled(m.contentXfersEnabledWired)
	contentXfersEnabledWireless = GetDataTransferEnabled(m.contentXfersEnabledWireless)
	m.contentXfersBinding% = GetBinding(contentXfersEnabledWired, contentXfersEnabledWireless)

	logUploadsXfersEnabledWired = GetDataTransferEnabled(m.logUploadsXfersEnabledWired)
	logUploadsXfersEnabledWireless = GetDataTransferEnabled(m.logUploadsXfersEnabledWireless)
	m.logUploadsXfersBinding% = GetBinding(logUploadsXfersEnabledWired, logUploadsXfersEnabledWireless)

    base$ = m.GetRegistryValue(registrySection, "ub", "ub")

    m.next_url$ = m.GetURL(registrySection, base$, "nu", "next")
    m.event_url$ = m.GetURL(registrySection, base$, "vu", "event")
    m.error_url$ = m.GetURL(registrySection, base$, "eu", "error")
    m.device_error_url$ = m.GetURL(registrySection, base$, "de", "deviceerror")
	m.deviceDownloadURL = m.GetURL(registrySection, base$, "dd", "devicedownload")
    m.deviceDownloadProgressURL = registrySection.Read("dp")
    if m.deviceDownloadProgressURL <> "" then
        if instr(1, m.deviceDownloadProgressURL, ":") <= 0 then
            m.deviceDownloadProgressURL = base$ + m.deviceDownloadProgressURL
        endif
    endif
    m.trafficDownloadURL$ = registrySection.Read("td")
    if m.trafficDownloadURL$ <> "" then
        m.trafficDownloadURL$ = base$ + m.trafficDownloadURL$
    endif
    
    m.uploadLogFileURL$ = registrySection.Read("ul")
    if m.uploadLogFileURL$ <> "" then
        m.uploadLogFileURL$ = base$ + m.uploadLogFileURL$
    endif

    if m.deviceDownloadProgressURL <> "" then
        m.deviceDownloadProgressUploadURL.SetUrl(m.deviceDownloadProgressURL)
        m.deviceDownloadProgressUploadURL.SetPort(m.msgPort)
'        m.deviceDownloadProgressUploadURL.SetMinimumTransferRate(1,500)
		m.deviceDownloadProgressUploadURL.SetTimeout(15000)
    endif
    
    if m.deviceDownloadURL <> "" then
        m.deviceDownloadUploadURL.SetUrl(m.deviceDownloadURL)
        m.deviceDownloadUploadURL.SetPort(m.msgPort)
        m.deviceDownloadUploadURL.SetMinimumTransferRate(1,500)
    endif
    
    m.systemTime.SetTimeZone(m.timezone$)

    m.diagnostics.PrintTimestamp()
	m.diagnostics.PrintDebug("### Recovery_runsetup script suggests next_url URL of " + m.next_url$)

	m.proxy_mode = false
    nc = CreateObject("roNetworkConfiguration", 0)
    if type(nc) = "roNetworkConfiguration"
        if nc.GetProxy() <> "" then
	        m.proxy_mode = true
	    endif
    endif
    nc = 0

' Check for updates every minute
	m.checkAlarm = CreateObject("roTimer")
	m.checkAlarm.SetPort(m.msgPort)
	m.checkAlarm.SetDate(-1, -1, -1)
	m.checkAlarm.SetTime(-1, -1, 0, 0)
	if not m.checkAlarm.Start() then stop	

    return true

End Function


Function GetURL(registrySection As Object, base$ As String, newRegistryKey$ As String, legacyRegistryKey$ As String) As String

    urlFromRegistry$ = m.GetRegistryValue(registrySection, newRegistryKey$, legacyRegistryKey$)
    if urlFromRegistry$ = "" then m.diagnostics.PrintDebug("Error: " + newRegistryKey$ + " not set in registry") :stop
    if instr(1, urlFromRegistry$, ":") > 0 then
        url$ = urlFromRegistry$
    else
        url$ = base$ + urlFromRegistry$
    endif
    
    return url$
    
End Function


Function GetRegistryValue(registrySection As Object, newRegistryKey$ As String, oldRegistryKey$ As String) As String
    
    value$ = registrySection.Read(newRegistryKey$)
    if value$ = "" then
        value$ = registrySection.Read(oldRegistryKey$)
    endif
    return value$

End Function


Sub StartSync()

' Call when you want to start a sync operation

    m.diagnostics.PrintTimestamp()
    m.diagnostics.PrintDebug("### start_sync")
    
	if type(m.syncPool) = "roSyncPool" then
' This should be improved in the future to work out
' whether the sync spec we're currently satisfying
' matches the one that we're currently downloading or
' not.
        m.diagnostics.PrintDebug("### sync already active so we'll let it continue")
        m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNC_ALREADY_ACTIVE, "")
		return
	endif

	m.xfer = CreateObject("roUrlTransfer")
	m.xfer.SetPort(m.msgPort)
    m.xfer.SetUserAgent(m.userAgent$)

    m.diagnostics.PrintDebug("### xfer created - identity = " + str(m.xfer.GetIdentity()) + " ###")

    m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_CHECK_CONTENT, m.next_url$)

' use registry data since we don't have a sync list

	m.diagnostics.PrintDebug("### Looking for new sync list from " + m.next_url$)
	m.xfer.SetUrl(m.next_url$)
    m.xfer.AddHeader("account", m.account$)
    if m.bsnrt$ <> "" then
      m.xfer.AddHeader("registrationToken", m.bsnrt$)
    else
      m.xfer.AddHeader("user", m.user$)
      m.xfer.AddHeader("password", m.password$)
    endif
    m.xfer.AddHeader("group", m.group$)
    m.xfer.AddHeader("timezone", m.timezone$)
    m.xfer.AddHeader("localTime", m.systemTime.GetLocalDateTime().GetString())
    m.xfer.AddHeader("synclistid", "0")
    m.xfer.AddHeader("unitName", m.unitName$)
    m.xfer.AddHeader("unitNamingMethod", m.unitNamingMethod$)    
    m.xfer.AddHeader("unitDescription", m.unitDescription$)
    m.xfer.AddHeader("timeBetweenNetConnects", m.timeBetweenNetConnects$)    
    m.xfer.AddHeader("contentDownloadsRestricted", m.contentDownloadsRestricted$)    
    if m.contentDownloadsRestricted$ = "yes" then
        m.xfer.AddHeader("contentDownloadRangeStart", m.contentDownloadRangeStart$)    
        m.xfer.AddHeader("contentDownloadRangeLength", m.contentDownloadRangeLength$)    
    endif
    m.xfer.AddHeader("timeBetweenHeartbeats", m.timeBetweenHeartbeats$)    
    m.xfer.AddHeader("heartbeatsRestricted", m.heartbeatsRestricted$)    
    if m.heartbeatsRestricted$ = "yes" then
        m.xfer.AddHeader("heartbeatsRangeStart", m.heartbeatsRangeStart$)    
        m.xfer.AddHeader("heartbeatsRangeLength", m.heartbeatsRangeLength$)    
    endif

    m.xfer.AddHeader("dwsEnabled", m.dwsEnabled$)    
    m.xfer.AddHeader("dwsPassword", m.dwsPassword$)    
    
    m.xfer.AddHeader("playbackLoggingEnabled", m.playbackLoggingEnabled$)    
    m.xfer.AddHeader("eventLoggingEnabled", m.eventLoggingEnabled$)    
    m.xfer.AddHeader("diagnosticLoggingEnabled", m.diagnosticLoggingEnabled$)    
    m.xfer.AddHeader("stateLoggingEnabled", m.stateLoggingEnabled$)    
    m.xfer.AddHeader("variableLoggingEnabled", m.variableLoggingEnabled$)    
    m.xfer.AddHeader("uploadLogFilesAtBoot", m.uploadLogFilesAtBoot$)    
    m.xfer.AddHeader("uploadLogFilesAtSpecificTime", m.uploadLogFilesAtSpecificTime$)    
    m.xfer.AddHeader("uploadLogFilesTime", m.uploadLogFilesTime$)    

	m.xfer.AddHeader("hostname", m.hostname$)
	
	m.xfer.AddHeader("lwsConfig", m.lwsConfig$)
	if not m.lwsConfig$ = "none" then
		m.xfer.AddHeader("lwsUserName", m.lwsUserName$)
		m.xfer.AddHeader("lwsPassword", m.lwsPassword$)
		m.xfer.AddHeader("lwsEnableUpdateNotifications", m.lwsEnableUpdateNotifications$)
	endif
	
	
	m.xfer.AddHeader("splashScreenContentId", m.splashScreenContentId$)
	
	m.xfer.AddHeader("idleScreenColor", m.idleScreenColor$)
	
	m.xfer.AddHeader("proxy", m.proxy$)

	m.xfer.AddHeader("proxyBypass", m.proxyBypassHostnames$)

	m.xfer.AddHeader("useWireless", m.useWireless)    
    if m.useWireless = "yes" then
        m.xfer.AddHeader("ssid", m.ssid$)    
        m.xfer.AddHeader("passphrase", m.passphrase$)    
    endif

    print "time server in recovery_runsetup_ba.brs as added to m.xfer http header = ";m.timeServer$
    m.xfer.AddHeader("timeServer", m.timeServer$)    

' first network configuration
    m.xfer.AddHeader("useDHCP", m.useDHCP$)    
    if m.useDHCP$ = "no" then
        m.xfer.AddHeader("staticIPAddress", m.staticIPAddress$)    
        m.xfer.AddHeader("subnetMask", m.subnetMask$)    
        m.xfer.AddHeader("broadcast", m.broadcast$)    
        m.xfer.AddHeader("gateway", m.gateway$)    
        m.xfer.AddHeader("dns1", m.dns1$)    
        m.xfer.AddHeader("dns2", m.dns2$)    
        m.xfer.AddHeader("dns3", m.dns3$)    
    endif

    m.xfer.AddHeader("rateLimitModeOutsideWindow", m.rateLimitModeOutsideWindow$)    
    m.xfer.AddHeader("rateLimitRateOutsideWindow", m.rateLimitRateOutsideWindow$)    
    m.xfer.AddHeader("rateLimitModeInWindow", m.rateLimitModeInWindow$)    
    m.xfer.AddHeader("rateLimitRateInWindow", m.rateLimitRateInWindow$)    
    m.xfer.AddHeader("rateLimitModeInitialDownloads", m.rateLimitModeInitialDownloads$)    
    m.xfer.AddHeader("rateLimitRateInitialDownloads", m.rateLimitRateInitialDownloads$)    

' second network configuration
    m.xfer.AddHeader("useDHCP_2", m.useDHCP_2$)    
    if m.useDHCP_2$ = "no" then
        m.xfer.AddHeader("staticIPAddress_2", m.staticIPAddress_2$)    
        m.xfer.AddHeader("subnetMask_2", m.subnetMask_2$)    
        m.xfer.AddHeader("gateway_2", m.gateway_2$)    
        m.xfer.AddHeader("dns1_2", m.dns1_2$)    
        m.xfer.AddHeader("dns2_2", m.dns2_2$)    
        m.xfer.AddHeader("dns3_2", m.dns3_2$)    
    endif

    m.xfer.AddHeader("rateLimitModeOutsideWindow_2", m.rateLimitModeOutsideWindow_2$)    
    m.xfer.AddHeader("rateLimitRateOutsideWindow_2", m.rateLimitRateOutsideWindow_2$)    
    m.xfer.AddHeader("rateLimitModeInWindow_2", m.rateLimitModeInWindow_2$)    
    m.xfer.AddHeader("rateLimitRateInWindow_2", m.rateLimitRateInWindow_2$)    
    m.xfer.AddHeader("rateLimitModeInitialDownloads_2", m.rateLimitModeInitialDownloads_2$)    
    m.xfer.AddHeader("rateLimitRateInitialDownloads_2", m.rateLimitRateInitialDownloads_2$)    

	m.xfer.AddHeader("networkConnectionPriorityWired", m.networkConnectionPriorityWired$)    
	m.xfer.AddHeader("contentXfersEnabledWired", m.contentXfersEnabledWired)
	m.xfer.AddHeader("textFeedsXfersEnabledWired", m.textFeedsXfersEnabledWired)
	m.xfer.AddHeader("healthXfersEnabledWired", m.healthXfersEnabledWired)
	m.xfer.AddHeader("mediaFeedsXfersEnabledWired", m.mediaFeedsXfersEnabledWired)
	m.xfer.AddHeader("logUploadsXfersEnabledWired", m.logUploadsXfersEnabledWired)

	if m.useWireless = "yes" then
		m.xfer.AddHeader("networkConnectionPriorityWireless", m.networkConnectionPriorityWireless$)    
		m.xfer.AddHeader("contentXfersEnabledWireless", m.contentXfersEnabledWireless)
		m.xfer.AddHeader("textFeedsXfersEnabledWireless", m.textFeedsXfersEnabledWireless)
		m.xfer.AddHeader("healthXfersEnabledWireless", m.healthXfersEnabledWireless)
		m.xfer.AddHeader("mediaFeedsXfersEnabledWireless", m.mediaFeedsXfersEnabledWireless)
		m.xfer.AddHeader("logUploadsXfersEnabledWireless", m.logUploadsXfersEnabledWireless)
	endif
    
' Add device unique identifier, timezone
    m.xfer.AddHeader("DeviceID", m.deviceUniqueID$)
    m.xfer.AddHeader("DeviceFWVersion", m.deviceFWVersion$)
    m.xfer.AddHeader("DeviceSWVersion", "recovery.brs " + m.setupVersion$)
    m.xfer.AddHeader("DeviceModel", m.deviceModel$)
    m.xfer.AddHeader("DeviceFamily", m.deviceFamily$)
    
' Add card size
	m.xfer.AddHeader("storage-size", str(m.cardSizeInMB))

' Add remote snapshot info
    m.xfer.AddHeader("deviceScreenShotsEnabled", m.deviceScreenShotsEnabled$)
    m.xfer.AddHeader("deviceScreenShotsInterval",  m.deviceScreenShotsInterval$) 
	m.xfer.AddHeader("deviceScreenShotsCountLimit", m.deviceScreenShotsCountLimit$)
	m.xfer.AddHeader("deviceScreenShotsQuality", m.deviceScreenShotsQuality$)
	m.xfer.AddHeader("deviceScreenShotsDisplayPortrait", m.deviceScreenShotsDisplayPortrait$)

' BrightWall parameters
	if m.brightWallName$ <> "" and m.brightWallScreenNumber$ <> "" then
		m.xfer.AddHeader("BrightWallName", m.brightWallName$)
		m.xfer.AddHeader("BrightWallScreenNumber", m.brightWallScreenNumber$)
	endif

' Beacon info
    beaconInfo$ = GetBeaconHeaderValue(m.beacon1Json$)
    if Len(beaconInfo$) > 0 then
        m.xfer.Addheader("BSN-Device-Beacon", beaconInfo$)
    end if
    beaconInfo$ = GetBeaconHeaderValue(m.beacon2Json$)
    if Len(beaconInfo$) > 0 then
        m.xfer.Addheader("BSN-Device-Beacon", beaconInfo$)
    end if

' Add setup info
    if m.setup then
    	m.xfer.AddHeader("setup", "yes")
    endif

	if m.multipleNetworkInterfaceFunctionsExist then
		m.diagnostics.PrintDebug("### binding for StartSync is " + stri(m.contentXfersBinding%))
		ok = m.xfer.BindToInterface(m.contentXfersBinding%)
		if not ok then stop
	endif

    if not m.xfer.AsyncGetToObject("roSyncSpec") then stop

    return
    
End Sub

Function GetBeaconHeaderValue(beaconJson$ As String) As String

    beaconHeaderValue$ = ""
    if beaconJson$.Len() > 0 then 
        beacon = ParseJSON(beaconJson$)
        if IsInteger(beacon.Type) and IsString(beacon.BeaconId) and IsString(beacon.Name) and IsInteger(beacon.TxLevel) then
            txLevel$ = stri(beacon.TxLevel)
            if Left(txLevel$, 1) = " " then
                txLevel$ = Right(txLevel$, Len(txLevel$)-1)
            end if
            if beacon.Type = 0 then
                if IsString(beacon.Data1) and IsString(beacon.Data2) then
                    beaconHeaderValue$ = "mode=iBeacon;uuid=" + beacon.BeaconId + ";major=" + beacon.Data1 + ";minor=" + beacon.Data2 + ";tx_power=" + txLevel$ + ";name=" + beacon.Name
                end if
            else if beacon.Type = 1 then
                beaconHeaderValue$ = "mode=eddystone-url;url=" + beacon.BeaconId + ";tx_power=" + txLevel$ + ";name=" + beacon.Name
            else if beacon.Type = 2 then
                if IsString(beacon.Data1) then
                    beaconHeaderValue$ = "mode=eddystone-uid;instance=" + beacon.Data1 + ";namespace=" + beacon.BeaconId + ";tx_power=" + txLevel$ + ";name=" + beacon.Name
                end if
            end if
        end if
    end if
    return beaconHeaderValue$

End Function

Function IsString(inputVariable As Object) As Boolean

    if type(inputVariable) = "roString" or type(inputVariable) = "String" then return true
    return false
    
End Function

Function IsInteger(inputVariable As Object) As Boolean

    if type(inputVariable) = "roInt" or type(inputVariable) = "Integer" then return true
    return false
    
End Function


Function GetBinding(wiredTransferEnabled As Boolean, wirelessTransferEnabled As Boolean) As Integer

	binding% = -1
	if wiredTransferEnabled <> wirelessTransferEnabled then
		if wiredTransferEnabled then
			binding% = 0
		else
			binding% = 1
		endif
	endif

	return binding%

End Function


Function GetDataTransferEnabled(spec$ As String) As Boolean

	dataTransferEnabled = true
	if lcase(spec$) = "false" then dataTransferEnabled = false
	return dataTransferEnabled

End Function


' Call when we get a URL event
Sub URLEvent(msg As Object)

    m.diagnostics.PrintTimestamp()
    m.diagnostics.PrintDebug("### url_event")

	if type (m.xfer) <> "roUrlTransfer" then return
	
    if msg.GetSourceIdentity() = m.trafficDownloadUploadURL.GetIdentity() then
        m.URLTrafficDownloadXferEvent(msg)
	
    else if type(m.deviceDownloadProgressUploadURL) = "roUrlTransfer" and msg.GetSourceIdentity() = m.deviceDownloadProgressUploadURL.GetIdentity() then
        m.URLDeviceDownloadProgressXferEvent(msg)
	
    else if type(m.deviceDownloadUploadURL) = "roUrlTransfer" and msg.GetSourceIdentity() = m.deviceDownloadUploadURL.GetIdentity() then
	    m.URLDeviceDownloadXferEvent(msg)
    
    else if type(m.uploadLogFileURLXfer) = "roUrlTransfer" and msg.GetSourceIdentity() = m.uploadLogFileURLXfer.GetIdentity() then
        m.UploadLogFileHandler(msg)
    
	else if msg.GetSourceIdentity() = m.xfer.GetIdentity() then
		xferInUse = false
		if msg.GetResponseCode() = 200 then
	        m.newSync = msg.GetObject()
			if type(m.newSync) = "roSyncSpec" then
			    
                m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNCSPEC_RECEIVED, "YES")

				if m.fwSupportsDecryption then
					headers=msg.getResponseHeaders()
					if type(headers) = "roAssociativeArray" and headers.DoesExist("bsn-content-passphrase") then
						m.obfuscatedEncryptionKey = headers["bsn-content-passphrase"]
					else
						m.obfuscatedEncryptionKey = ""
					endif
				endif
			    
                m.diagnostics.PrintDebug("### Server gave us spec: " + m.newSync.GetName())

				' check for a forced reboot
				forceReboot$ = LCase(m.newSync.LookupMetadata("client", "forceReboot"))
				if forceReboot$ = "true" then
					m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNCSPEC_RECEIVED, "FORCE REBOOT")
					m.logging.FlushLogFile()
					a=RebootSystem()
					stop
				endif
	                
				' check for forced log upload
				forceLogUpload$ = LCase(m.newSync.LookupMetadata("client", "forceLogUpload"))
				if forceLogUpload$ = "true" then
					m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNCSPEC_RECEIVED, "FORCE LOG UPLOAD")
					m.logging.CutoverLogFile(true)
				endif
                
                m.lastNewSync = m.newSync ' keep this around so it can be used to lookup info
                    
                m.syncPoolFiles = CreateObject("roSyncPoolFiles", "pool", m.newSync)
                                        
				m.BuildFileDownloadList(m.newSync)
                m.UploadDeviceDownloadProgressFileList()
                m.AddDeviceDownloadItem("SyncSpecDownloadStarted", "", "")
                                                        
			    m.contentDownloaded# = 0#

' m.newSync.WriteToFile("debug-sync.xml")
' stop

' Log the start of sync list download
                m.logging.WriteDiagnosticLogEntry( m.diagnosticCodes.EVENT_DOWNLOAD_START, "")
                m.SendEvent("StartSyncListDownload", m.newSync.GetName(), "")

				m.syncPool = CreateObject("roSyncPool", "pool")
				m.syncPool.SetPort(m.msgPort)
                m.syncPool.SetMinimumTransferRate(1000,900)
                    
                ' SetFileProgressIntervalSeconds doesn't exist in older versions of FW - deal with it.
                ' version number 3.3.62 = 197438. all versions of pandora3 support this call
                if m.deviceFWVersionNumber% >= 197438 or m.deviceFamily$ = "pandora3" then
                    m.syncPool.SetFileProgressIntervalSeconds(15)
                endif  
                                      
                m.syncPool.SetHeaders(m.newSync.GetMetadata("server"))
                m.syncPool.AddHeader("DeviceID", m.deviceUniqueID$)
                m.syncPool.AddHeader("User-Agent", m.userAgent$)

' implies dodgy XML, or something is already running. could happen if server sends down bad xml.

' if a proxy server has been set, enable the use of the cache
                if m.proxy_mode then
					m.syncPool.AddHeader("Roku-Cache-Request", "Yes")
				endif

				if m.multipleNetworkInterfaceFunctionsExist then
					m.diagnostics.PrintDebug("### binding for syncPool is " + stri(m.contentXfersBinding%))
					ok = m.syncPool.BindToInterface(m.contentXfersBinding%)
					if not ok then stop
				endif

				if not m.syncPool.AsyncDownload(m.newSync) then
                    m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNCSPEC_DOWNLOAD_IMMEDIATE_FAILURE, m.syncPool.GetFailureReason())
				    m.diagnostics.PrintTimestamp()
                    m.diagnostics.PrintDebug("### AsyncDownload failed: " + m.syncPool.GetFailureReason())
                    m.SendDeviceError("SyncSpecImmediateDownloadFailure", m.newSync.GetName(), "AsyncDownloadFailure: " + m.syncPool.GetFailureReason(), "")
					m.newSync = invalid
				endif
' implies dodgy XML, or something is already running. could happen if server sends down bad xml.
			else
			    m.diagnostics.PrintDebug("### Failed to read new sync spec")
                m.SendDeviceError("SyncSpecReadFailure", m.newSync.GetName(), "Failed to read new sync spec", "")
				m.newSync = invalid
			endif
		else if msg.GetResponseCode() = 404 then
            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_NO_SYNCSPEC_AVAILABLE, "404")
            m.diagnostics.PrintDebug("### Server has no sync list for us: " + str(msg.GetResponseCode()))
		else
' retry - server returned something other than a 200 or 404
            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_RETRIEVE_SYNCSPEC_FAILURE, str(msg.GetResponseCode()))
            m.diagnostics.PrintDebug("### Failed to download sync list. Error " + str(msg.GetResponseCode()))
            m.SendDeviceError("SyncSpecDownloadFailure", "", "Failed to download sync list", str(msg.GetResponseCode()))
		endif
	else
	    m.diagnostics.PrintDebug("### url_event from beyond this world: " + str(msg.GetSourceIdentity()) + ", " + str(msg.GetResponseCode()) + ", " + str(msg.GetInt()))
        m.SendDeviceError("URLBeyondThisWorldError", "", "url_event from beyond this world", "")
	endif
	
	return

End Sub


Sub URLDeviceDownloadXferEvent(msg as Object)

    m.UploadDeviceDownload()
    
End Sub


Sub AddDeviceDownloadItem(downloadEvent$ As String, fileName$ As String, downloadData$ As String)
    
    deviceDownloadItem = CreateObject("roAssociativeArray")
    deviceDownloadItem.downloadEvent$ = downloadEvent$
    deviceDownloadItem.fileName$ = fileName$
    deviceDownloadItem.downloadData$ = downloadData$
    m.DeviceDownloadItems.push(deviceDownloadItem)

    m.UploadDeviceDownload()
    
End Sub


Sub UploadDeviceDownload()

    if m.deviceDownloadURL = "" then
        m.diagnostics.PrintDebug("### UploadDeviceDownload - deviceDownloadURL not set, return")
        return
    else
        m.diagnostics.PrintDebug("### UploadDeviceDownload")
    endif

' verify that there is content to upload
    if m.DeviceDownloadItems.Count() = 0 then return
    
' if a transfer is in progress, return
	if not m.deviceDownloadUploadURL.SetUrl(m.deviceDownloadURL) then
        m.diagnostics.PrintDebug("### UploadDeviceDownload - upload already in progress")
        if m.DeviceDownloadItems.Count() > 50 then
            m.diagnostics.PrintDebug("### UploadDeviceDownload - clear items from queue")
            m.DeviceDownloadItems.Clear()
        endif        
		return 
	end if

' generate the XML and upload the data
    root = CreateObject("roXMLElement")
    
    root.SetName("DeviceDownloadBatch")

    for each deviceDownloadItem in m.DeviceDownloadItems
    
        item = root.AddBodyElement()
        item.SetName("deviceDownload")

        elem = item.AddElement("downloadEvent")
        elem.SetBody(deviceDownloadItem.downloadEvent$)
    
        elem = item.AddElement("fileName")
        elem.SetBody(deviceDownloadItem.fileName$)
    
        elem = item.AddElement("downloadData")
        elem.SetBody(deviceDownloadItem.downloadData$)
    
    next

    xml = root.GenXML({ indent: " ", newline: chr(10), header: true })

' prepare the upload    
    contentDisposition$ = GetContentDisposition("UploadDeviceDownload.xml")
    m.AddUploadHeaders(m.deviceDownloadUploadURL, contentDisposition$)

' clear out DeviceDownloadItems - no big deal if the post fails
    m.DeviceDownloadItems.Clear()

	if m.multipleNetworkInterfaceFunctionsExist then
		m.diagnostics.PrintDebug("### binding for UploadDeviceDownload is " + stri(m.contentXfersBinding%))
		ok = m.deviceDownloadUploadURL.BindToInterface(m.contentXfersBinding%)
		if not ok then stop
	endif

	ok = m.deviceDownloadUploadURL.AsyncPostFromString(xml)
    if not ok then
        m.diagnostics.PrintDebug("### UploadDeviceDownload - AsyncPostFromString failed")
    else
		' clear out DeviceDownloadItems - no big deal if the post fails
		m.DeviceDownloadItems.Clear()
    endif
        
End Sub


Sub URLDeviceDownloadProgressXferEvent(msg as Object)

	if msg.GetResponseCode() = 200 then
		m.DeviceDownloadProgressItemsPendingUpload.Clear()
	else
		m.diagnostics.PrintDebug("###  DeviceDownloadProgressURLEvent: " + stri(msg.GetResponseCode()))
	endif
	m.UploadDeviceDownloadProgressItems()

End Sub


Sub BuildFileDownloadList(syncSpec As Object)

	listOfDownloadFiles = syncSpec.GetFileList("download")
        
    fileInPoolStatus = CreateObject("roAssociativeArray")
	tmpSyncPool = CreateObject("roSyncPool", "pool")
	if type(tmpSyncPool) = "roSyncPool" then
        ' version number 3.3.62 = 197438. all versions of pandora3 support this call
        if m.deviceFWVersionNumber% >= 197438 or m.deviceFamily$ = "pandora3" then
            fileInPoolStatus = tmpSyncPool.QueryFiles(m.newSync)
        endif  
    endif
        
    m.filesToDownload = CreateObject("roAssociativeArray")
    m.chargeableFiles = CreateObject("roAssociativeArray")
                
    for each downloadFile in listOfDownloadFiles
        
        if not m.filesToDownload.DoesExist(downloadFile.hash) then
            fileToDownload = CreateObject("roAssociativeArray")
            fileToDownload.name = downloadFile.name
            fileToDownload.size = downloadFile.size
            fileToDownload.hash = downloadFile.hash
                
            fileToDownload.currentFilePercentage$ = ""
            fileToDownload.status$ = ""

            ' check to see if this file is already in the pool (and therefore doesn't need to be downloaded)
            if fileInPoolStatus.DoesExist(downloadFile.name) then
                fileInPool = fileInPoolStatus.Lookup(downloadFile.name)
                if fileInPool then
                    fileToDownload.currentFilePercentage$ = "100"
                    fileToDownload.status$ = "ok"
                endif
            endif
                
            m.filesToDownload.AddReplace(downloadFile.hash, fileToDownload)
        endif
            
		if type(downloadFile.chargeable) = "roString" then
             if lcase(downloadFile.chargeable) = "yes" then
                m.chargeableFiles[downloadFile.name] = true
            endif
        endif
            
    next
                                
End Sub


Sub PushDeviceDownloadProgressItem(fileItem As Object, type$ As String, currentFilePercentage$ As String, status$ As String)

    deviceDownloadProgressItem = CreateObject("roAssociativeArray")
    deviceDownloadProgressItem.type$ = type$
    deviceDownloadProgressItem.name$ = fileItem.name
    deviceDownloadProgressItem.hash$ = fileItem.hash
    deviceDownloadProgressItem.size$ = fileItem.size
    deviceDownloadProgressItem.currentFilePercentage$ = currentFilePercentage$
    deviceDownloadProgressItem.status$ = status$
    deviceDownloadProgressItem.utcTime$ = m.systemTime.GetUtcDateTime().GetString()

	if m.DeviceDownloadProgressItems.DoesExist(fileItem.name)
		existingDeviceDownloadProgressItem = m.DeviceDownloadProgressItems.Lookup(fileItem.name)
		deviceDownloadProgressItem.type$ = existingDeviceDownloadProgressItem.type$
	endif

	m.DeviceDownloadProgressItems.AddReplace(fileItem.name, deviceDownloadProgressItem)

End Sub


Sub AddDeviceDownloadProgressItem(fileItem As Object, currentFilePercentage$ As String, status$ As String)

	m.PushDeviceDownloadProgressItem(fileItem, "deviceDownloadProgressItem", currentFilePercentage$, status$)
    m.UploadDeviceDownloadProgressItems()
    
End Sub


Sub UploadDeviceDownloadProgressFileList()

    if m.deviceDownloadProgressURL = "" then
        m.diagnostics.PrintDebug("### UploadDeviceDownloadProgressFileList - deviceDownloadProgressURL not set, return")
        return
    else
        m.diagnostics.PrintDebug("### UploadDeviceDownloadProgressFileList")
    endif

' cancel any uploads of this type that are in progress
	m.deviceDownloadProgressUploadURL.AsyncCancel()

' this data will overwrite any pending data so clear the existing data structures
    m.DeviceDownloadProgressItems.Clear()
    m.DeviceDownloadProgressItemsPendingUpload.Clear()

' create progress items for each file in the sync spec
    for each fileToDownloadKey in m.filesToDownload
        fileToDownload = m.filesToDownload.Lookup(fileToDownloadKey)
		m.PushDeviceDownloadProgressItem(fileToDownload, "fileInSyncSpec", fileToDownload.currentFilePercentage$, fileToDownload.status$)
	next

	m.UploadDeviceDownloadProgressItems()

End Sub


Sub AddUploadHeaders(url As Object, contentDisposition$)

    if type(m.lastNewSync) = "roSyncSpec" then
        url.SetHeaders(m.lastNewSync.GetMetadata("server"))
    else
        url.SetHeaders({})
        url.AddHeader("account", m.account$)
        if m.bsnrt$ <> "" then
          url.AddHeader("registrationToken", m.bsnrt$)
        else
          url.AddHeader("user", m.user$)
          url.AddHeader("password", m.password$)
        endif
        url.AddHeader("group", m.group$)
    endif

' Add device unique identifier, timezone
    url.AddHeader("DeviceID", m.deviceUniqueID$)
    
    url.AddHeader("DeviceModel", m.deviceModel$)
    url.AddHeader("DeviceFamily", m.deviceFamily$)
    url.AddHeader("DeviceFWVersion", m.deviceFWVersion$)
    
    url.AddHeader("utcTime", m.systemTime.GetUtcDateTime().GetString())

    url.AddHeader("Content-Type", "application/octet-stream")
    
    url.AddHeader("Content-Disposition", contentDisposition$)

End Sub


Function GetContentDisposition(file As String) As String

'Content-Disposition: form-data; name="file"; filename="UploadPlaylog.xml"

    contentDisposition$ = "form-data; name="
    contentDisposition$ = contentDisposition$ + chr(34)
    contentDisposition$ = contentDisposition$ + "file"
    contentDisposition$ = contentDisposition$ + chr(34)
    contentDisposition$ = contentDisposition$ + "; filename="
    contentDisposition$ = contentDisposition$ + chr(34)
    contentDisposition$ = contentDisposition$ + file
    contentDisposition$ = contentDisposition$ + chr(34)

    return contentDisposition$
    
End Function


Sub UploadDeviceDownloadProgressItems()

    if m.deviceDownloadProgressURL = "" then
        m.diagnostics.PrintDebug("### UploadDeviceDownloadProgressItems - deviceDownloadProgressURL not set, return")
        return
    else
        m.diagnostics.PrintDebug("### UploadDeviceDownloadProgressItems")
    endif

' verify that there is content to upload
    if m.DeviceDownloadProgressItems.IsEmpty() and m.DeviceDownloadProgressItemsPendingUpload.IsEmpty() then return
    
' if a transfer is in progress, return
	if not m.deviceDownloadProgressUploadURL.SetUrl(m.deviceDownloadProgressURL) then
        m.diagnostics.PrintDebug("### UploadDeviceDownloadProgressItems - upload already in progress")
		return 
	else
        m.diagnostics.PrintDebug("### UploadDeviceDownloadProgressItems - proceed with post")
	end if

' merge new items into pending items
	for each deviceDownloadProgressItemKey in m.DeviceDownloadProgressItems
		deviceDownloadProgressItem = m.DeviceDownloadProgressItems.Lookup(deviceDownloadProgressItemKey)
		if m.DeviceDownloadProgressItemsPendingUpload.DoesExist(deviceDownloadProgressItem.name$)
			existingDeviceDownloadProgressItem = m.DeviceDownloadProgressItemsPendingUpload.Lookup(deviceDownloadProgressItem.name$)
			deviceDownloadProgressItem.type$ = existingDeviceDownloadProgressItem.type$
		endif
		m.DeviceDownloadProgressItemsPendingUpload.AddReplace(deviceDownloadProgressItem.name$, deviceDownloadProgressItem)
	next

' generate the XML and upload the data
    root = CreateObject("roXMLElement")
    
    root.SetName("DeviceDownloadProgressItems")

	for each deviceDownloadProgressItemKey in m.DeviceDownloadProgressItemsPendingUpload
		deviceDownloadProgressItem = m.DeviceDownloadProgressItemsPendingUpload.Lookup(deviceDownloadProgressItemKey)
		BuildDeviceDownloadProgressItemXML(root, deviceDownloadProgressItem)
    next

    xml = root.GenXML({ indent: " ", newline: chr(10), header: true })

' prepare the upload    
    contentDisposition$ = GetContentDisposition("UploadDeviceDownloadProgressItems.xml")
    m.AddUploadHeaders(m.deviceDownloadProgressUploadURL, contentDisposition$)
    m.deviceDownloadProgressUploadURL.AddHeader("updateDeviceLastDownload", "true")

	if m.multipleNetworkInterfaceFunctionsExist then
		m.diagnostics.PrintDebug("### binding for UploadDeviceDownloadProgressItems is " + stri(m.contentXfersBinding%))
		ok = m.deviceDownloadProgressUploadURL.BindToInterface(m.contentXfersBinding%)
		if not ok then stop
	endif

	ok = m.deviceDownloadProgressUploadURL.AsyncPostFromString(xml)
    if not ok then
        m.diagnostics.PrintDebug("### UploadDeviceDownloadProgressItems - AsyncPostFromString failed")
    endif
        
	m.DeviceDownloadProgressItems.Clear()

End Sub


Sub BuildDeviceDownloadProgressItemXML(root As Object, deviceDownloadProgressItem As Object)

    item = root.AddBodyElement()
    item.SetName(deviceDownloadProgressItem.type$)

    elem = item.AddElement("name")
    elem.SetBody(deviceDownloadProgressItem.name$)
    
    elem = item.AddElement("hash")
    elem.SetBody(deviceDownloadProgressItem.hash$)
    
    elem = item.AddElement("size")
    elem.SetBody(deviceDownloadProgressItem.size$)
    
    elem = item.AddElement("currentFilePercentage")
    elem.SetBody(deviceDownloadProgressItem.currentFilePercentage$)
    
    elem = item.AddElement("status")
    elem.SetBody(deviceDownloadProgressItem.status$)
        
    elem = item.AddElement("utcTime")
    elem.SetBody(deviceDownloadProgressItem.utcTime$)

End Sub


Sub SyncPoolProgressEvent(msg As Object)

    m.diagnostics.PrintDebug("### File download progress " + msg.GetFileName() + str(msg.GetCurrentFilePercentage()))

    m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_FILE_DOWNLOAD_PROGRESS, msg.GetFileName() + chr(9) + str(msg.GetCurrentFilePercentage()))

    ' version number 3.3.62 = 197438. all versions of pandora3 support this call (or will ...)
    if m.deviceFWVersionNumber% >= 197438 or m.deviceFamily$ = "pandora3" then
        fileIndex% = msg.GetFileIndex()
        fileItem = m.lastNewSync.GetFile("download", fileIndex%)
        m.AddDeviceDownloadProgressItem(fileItem, str(msg.GetCurrentFilePercentage()), "ok")
    endif  

' old style
'    fileIndex% = msg.GetFileIndex()
'    listOfDownloadFiles = m.newSync.GetFileList("download")
'    fileItem = listOfDownloadFiles[fileIndex%]
'    m.AddDeviceDownloadProgressItem(fileItem, str(msg.GetCurrentFilePercentage()), "ok")

End Sub


' Call when we get a sync event
Sub PoolEvent(msg As Object)
    m.diagnostics.PrintTimestamp()
    m.diagnostics.PrintDebug("### pool_event")
	if type(m.syncPool) <> "roSyncPool" then
        m.diagnostics.PrintDebug("### pool_event but we have no object")
		return
	endif
	if msg.GetSourceIdentity() = m.syncPool.GetIdentity() then
		if (msg.GetEvent() = m.POOL_EVENT_FILE_DOWNLOADED) then
            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_FILE_DOWNLOAD_COMPLETE, msg.GetName())
            m.diagnostics.PrintDebug("### File downloaded " + msg.GetName())
            
            ' see if the user should be charged for this download
            if m.chargeableFiles.DoesExist(msg.GetName()) then
                filePath$ = m.syncPoolFiles.GetPoolFilePath(msg.GetName())            
                file = CreateObject("roReadFile", filePath$)
                if type(file) = "roReadFile" then
                    file.SeekToEnd()
			        m.contentDownloaded# = m.contentDownloaded# + file.CurrentPosition()
                    m.diagnostics.PrintDebug("### File size " + str(file.CurrentPosition()))
                endif
                file = invalid
            endif
            
		elseif (msg.GetEvent() = m.POOL_EVENT_FILE_FAILED) then
            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_FILE_DOWNLOAD_FAILURE, msg.GetName() + chr(9) + msg.GetFailureReason())
            m.diagnostics.PrintDebug("### File failed " + msg.GetName() + ": " + msg.GetFailureReason())
            m.SendDeviceError("FileDownloadFailure", msg.GetName(), msg.GetFailureReason(), str(msg.GetResponseCode()))
            
            ' version number 3.3.62 = 197438. all versions of pandora3 support this call (or will ...)
            if m.deviceFWVersionNumber% >= 197438 or m.deviceFamily$ = "pandora3" then
                fileIndex% = msg.GetFileIndex()
                fileItem = m.newSync.GetFile("download", fileIndex%)
                if type(fileItem) = "roAssociativeArray" then
                    m.AddDeviceDownloadProgressItem(fileItem, "-1", msg.GetFailureReason())
                endif
            endif  
            
		elseif (msg.GetEvent() = m.POOL_EVENT_ALL_DOWNLOADED) then
            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_DOWNLOAD_COMPLETE, "")		
            m.diagnostics.PrintDebug("### All downloaded for " + m.newSync.GetName())
            m.AddDeviceDownloadItem("All files downloaded", "", "")

' capture total content downloaded
            m.diagnostics.PrintDebug("### Total content downloaded = " + str(m.contentDownloaded#))
            ok = m.UploadTrafficDownload(m.contentDownloaded#)
            if ok then m.contentDownloaded# = 0#

' Log the end of sync list download
            m.SendEvent("EndSyncListDownload", m.newSync.GetName(), str(msg.GetResponseCode()))

' if the FW version supports it, realize files from the pool to the root folder; otherwise copy them
			usedRealize = false

			' version number 3.8.1 = 198657
			if m.deviceFWVersionNumber% >= 198657 then

				' realize script files to root folder
				newSyncSpecScriptsOnly  = m.newSync.FilterFiles("download", { group: "script" } )

				event = m.syncPool.Realize(newSyncSpecScriptsOnly, "/")

				if event.GetEvent() <> m.EVENT_REALIZE_SUCCESS then
					m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_REALIZE_FAILURE, stri(event.GetEvent()) + chr(9) + event.GetName() + chr(9) + event.GetFailureReason())
					m.diagnostics.PrintDebug("### Realize failed " + stri(event.GetEvent()) + chr(9) + event.GetName() + chr(9) + event.GetFailureReason() )
					m.SendDeviceError("RealizeFailure", event.GetName(), event.GetFailureReason(), str(event.GetEvent()))
			
					m.newSync = invalid
					m.syncPool = invalid
    
					return
				endif

				usedRealize = true

			endif

' Save to current-sync.xml then do cleanup
		    if not m.newSync.WriteToFile("current-sync.xml") then stop
		    if not m.newSync.WriteToFile("current-sync.json") then stop
            timezone = m.newSync.LookupMetadata("client", "timezone")
            if timezone <> "" then
                m.systemTime.SetTimeZone(timezone)
            endif
			
            m.diagnostics.PrintDebug("### DOWNLOAD COMPLETE")
            
            m.spf = CreateObject("roSyncPoolFiles", "pool", m.newSync)
            
			if not usedRealize then

	            autorunFile$ = m.GetPoolFilePath("autorun.brs")
		        if autorunFile$ = "" then stop

	            success = CopyFile(autorunFile$, "autorun.brs")
		        if not success then stop

				updateFileName$ = "update.rok"
				if m.deviceFamily$ = "panther" then
					updateFileName$ = "panther-update.bsfw"
				else if m.deviceFamily$ = "cheetah" then
					updateFileName$ = "cheetah-update.bsfw"
				endif

	            updateFile$ = m.GetPoolFilePath(updateFileName$)
		        if updateFile$ <> "" then
			        success = MoveFile(updateFile$,  updateFileName$)
				    m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_FIRMWARE_DOWNLOAD, "")		
				endif

			endif

'' TODO - are these needed for backwards compatibility? If yes, check and copy the files if they exist
''            autoscheduleFile$ = m.GetPoolFilePath("autoschedule.xml")
''            if autoscheduleFile$ = "" then stop
            
''            success = CopyFile(autoscheduleFile$, "autoschedule.xml")
''            if not success then stop
            
''            resourcesFile$ = m.GetPoolFilePath("resources.txt")

''            if resourcesFile$ <> "" then
''                success = CopyFile(resourcesFile$, "resources.txt")
''                if not success then stop
''            endif

''            boseProductsFile$ = m.GetPoolFilePath("BoseProducts.xml")
''            if boseProductsFile$ <> "" then
''                success = CopyFile(boseProductsFile$, "BoseProducts.xml")
''                if not success then stop
''            endif

			if m.fwSupportsDecryption then
				deviceCustomization = CreateObject("roDeviceCustomization")
				deviceCustomization.StoreObfuscatedEncryptionKey("AesCtrHmac", m.obfuscatedEncryptionKey)
			endif

            ' clear setup registry item
            registrySection = CreateObject("roRegistrySection", "networking")
            if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection":stop
            registrySection.Delete("su")
            registrySection.Flush()
            registrySection = invalid
            
            m.SendEventThenReboot("DownloadComplete", m.newSync.GetName(), "")

			m.newSync = invalid
			m.syncPool = invalid
			
		elseif (msg.GetEvent() = m.POOL_EVENT_ALL_FAILED) then
            m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_SYNCSPEC_DOWNLOAD_FAILURE, msg.GetFailureReason())		
            m.diagnostics.PrintDebug("### Sync failed: " + msg.GetFailureReason())
            m.SendDeviceError("POOL_EVENT_ALL_FAILED", "", msg.GetFailureReason(), str(msg.GetResponseCode()))
			
' capture total content downloaded
            m.diagnostics.PrintDebug("### Total content downloaded = " + str(m.contentDownloaded#))
            ok = m.UploadTrafficDownload(m.contentDownloaded#)
            if ok then m.contentDownloaded# = 0#

			m.newSync = invalid
			m.syncPool = invalid

		endif
	else
        m.diagnostics.PrintDebug("### pool_event from beyond this world: " + str(msg.GetSourceIdentity()))
	endif
	return

End Sub


Sub UploadLogFiles()

    if m.uploadLogFileURL$ = "" then return
    
' if a transfer is in progress, return
    m.diagnostics.PrintDebug("### Upload " + m.uploadLogFolder)
	if not m.uploadLogFileURLXfer.SetUrl(m.uploadLogFileURL$) then
        m.diagnostics.PrintDebug("### Upload " + m.uploadLogFolder + " - upload already in progress")
		return 
	end if

' see if there are any files to upload
    listOfLogFiles = MatchFiles("/" + m.uploadLogFolder, "*.log")
    if listOfLogFiles.Count() = 0 then return

	if m.multipleNetworkInterfaceFunctionsExist then
		m.diagnostics.PrintDebug("### binding for UploadLogFiles is " + stri(m.logUploadsXfersBinding%))
		ok = m.uploadLogFileURLXfer.BindToInterface(m.logUploadsXfersBinding%)
	endif

' upload the first file    
    for each file in listOfLogFiles
        m.diagnostics.PrintDebug("### UploadLogFiles " + file + " to " + m.uploadLogFileURL$)
        fullFilePath = m.uploadLogFolder + "/" + file
                
        contentDisposition$ = GetContentDisposition(file)
        m.AddUploadHeaders(m.uploadLogFileURLXfer, contentDisposition$)
        ok = m.uploadLogFileURLXfer.AsyncPostFromFile(fullFilePath)
        if not ok then
	        m.diagnostics.PrintDebug("### UploadLogFiles - AsyncPostFromFile failed")
        else
			m.logFileUpload = fullFilePath
			m.logFile$ = file
			return
        endif
        
    next
    
End Sub


Sub UploadLogFileHandler(msg As Object)
	    	    
    if msg.GetResponseCode() = 200 then

        if type(m.logFileUpload) = "roString" then
            m.diagnostics.PrintDebug("###  UploadLogFile XferEvent - successfully uploaded " + m.logFileUpload)
            if m.enableLogDeletion then
                DeleteFile(m.logFileUpload)
            else
                target$ = m.uploadLogArchiveFolder + "/" + m.logFile$
                ok = MoveFile(m.logFileUpload, target$)
            endif
            m.logFileUpload = invalid		    
        endif
        
    else
        
        if type(m.logFileUpload) = "roString" then
            m.diagnostics.PrintDebug("### Failed to upload log file " + m.logFileUpload + ", error code = " + str(msg.GetResponseCode()))

            ' move file so that the script doesn't try to upload it again immediately
            target$ = m.uploadLogFailedFolder + "/" + m.logFile$
            ok = MoveFile(m.logFileUpload, target$)

        endif

        m.logging.WriteDiagnosticLogEntry(m.diagnosticCodes.EVENT_LOGFILE_UPLOAD_FAILURE, str(msg.GetResponseCode()))
        
	endif
	
	m.UploadLogFiles()
		
End Sub


Function GetPoolFilePath(fileName$ As String) As Object

    return m.spf.GetPoolFilePath(fileName$)
    
'    filePath = m.translationTable[fileName$]
'    if type(filePath) = "roString" return filePath
'    return ""
    
End Function


Sub NetworkingSetSystemInfo(sysInfo As Object, diagnosticCodes As Object)

    m.setupVersion$ = sysInfo.setupVersion$
    m.deviceFWVersion$ = sysInfo.deviceFWVersion$
    m.deviceUniqueID$ = sysInfo.deviceUniqueID$
    m.deviceModel$ = sysInfo.deviceModel$
    m.deviceFamily$ = sysInfo.deviceFamily$
    m.deviceFWVersionNumber% = sysInfo.deviceFWVersionNumber%
	m.fwSupportsDecryption = sysInfo.fwSupportsDecryption

    m.diagnosticCodes = diagnosticCodes
    
    return

End Sub


Sub NetworkingSetUserAgent(sysInfo As Object)

    ' Create device specific User-Agent string, set this for all pre-created URLTransfer objects
    m.userAgent$ = "BrightSign/" + sysInfo.deviceUniqueID$ + "/" + sysInfo.deviceFWVersion$ + " (" + sysInfo.deviceModel$ + ")"
    m.deviceDownloadUploadURL.SetUserAgent(m.userAgent$)
    m.deviceErrorURL.SetUserAgent(m.userAgent$)
    m.deviceDownloadProgressUploadURL.SetUserAgent(m.userAgent$)
    m.trafficDownloadUploadURL.SetUserAgent(m.userAgent$)
    m.uploadLogFileURLXfer.SetUserAgent(m.userAgent$)

End Sub


Function SendEventCommon(eventURL As Object, eventType$ As String, eventData$ As String, eventResponseCode$ As String) As String

    m.diagnostics.PrintDebug("### send_event")
    
	eventURL.SetUrl(m.event_url$)
    eventURL.SetUserAgent(m.userAgent$)
    eventURL.AddHeader("account", m.account$)
    eventURL.AddHeader("group", m.group$)
''    eventURL.AddHeader("user", m.user$)
''    eventURL.AddHeader("password", m.password$)
    eventURL.AddHeader("DeviceID", m.deviceUniqueID$)
    eventURL.AddHeader("DeviceFWVersion", m.deviceFWVersion$)
    eventURL.AddHeader("DeviceSWVersion", "recovery_runsetup.brs " + m.setupVersion$)
    eventStr$ = "EventType=" + eventType$ + "&EventData=" + eventData$ + "&ResponseCode=" + eventResponseCode$

    return eventStr$

End Function


Sub SendEvent(eventType$ As String, eventData$ As String, eventResponseCode$ As String)

	eventURL = CreateObject("roUrlTransfer")
    eventURL.SetMinimumTransferRate(1,500)

    eventStr$ = m.SendEventCommon(eventURL, eventType$, eventData$, eventResponseCode$)

	eventURL.AsyncPostFromString(eventStr$)

    m.diagnostics.WriteToLog(eventType$, eventData$, eventResponseCode$, m.account$)

	return

End Sub


Sub WaitForTransfersToComplete()

    if m.trafficDownloadURL$ <> "" then
        ' check to see if the trafficUpload call has been processed - if not, wait 5 seconds
        if not m.trafficDownloadUploadURL.SetUrl(m.trafficDownloadURL$) then
            m.diagnostics.PrintDebug("### RebootAfterEventsSent - traffic upload still in progress - wait")
            sleep(8000)
            m.diagnostics.PrintDebug("### RebootAfterEventsSent - proceed after waiting 8 seconds for traffic upload to complete")
        else
            m.diagnostics.PrintDebug("### RebootAfterEventsSent - traffic upload must be complete - proceed")
        end if
    endif
    
    if m.deviceDownloadProgressURL <> "" then
        ' check to see if the device download progress call has been processed - if not, wait 5 seconds
	    if not m.deviceDownloadProgressUploadURL.SetUrl(m.deviceDownloadProgressURL) then
            sleep(5000)
            m.diagnostics.PrintDebug("### RebootAfterEventsSent - proceed after waiting 5 seconds for device download progress item upload to complete")
        else
            m.diagnostics.PrintDebug("### RebootAfterEventsSent - device download progress item upload must be complete - proceed")
        end if
    endif
    
    if m.deviceDownloadURL <> "" then
        ' check to see if the device download call has been processed - if not, wait 5 seconds
	    if not m.deviceDownloadUploadURL.SetUrl(m.deviceDownloadURL) then
            sleep(10000)
            m.diagnostics.PrintDebug("### RebootAfterEventsSent - proceed after waiting 5 seconds for device download upload to complete")
        else
            m.diagnostics.PrintDebug("### RebootAfterEventsSent - device download upload must be complete - proceed")
        end if
    endif

End Sub


Sub SendEventThenReboot(eventType$ As String, eventData$ As String, eventResponseCode$ As String)

    m.logging.FlushLogFile()
    
	eventURL = CreateObject("roUrlTransfer")
    eventURL.SetMinimumTransferRate(1,500)

    eventStr$ = m.SendEventCommon(eventURL, eventType$, eventData$, eventResponseCode$)

    eventPort = CreateObject("roMessagePort")
	eventURL.SetPort(eventPort)
	eventURL.AsyncPostFromString(eventStr$)

    m.diagnostics.WriteToLog(eventType$, eventData$, eventResponseCode$, m.account$)

    sleep(2000)
    
	m.WaitForTransfersToComplete()

	m.UploadDeviceDownloadProgressItems()    
	m.UploadDeviceDownload()
    
    m.WaitForTransfersToComplete()
    
    ' wait for the event to get sent
    unexpectedUrlEventCount = 0

    while true

        msg = wait(10000, eventPort)   ' wait for either a timeout (10 seconds) or a message indicating that the post was complete

        if type(msg) = "Invalid" then
            m.diagnostics.PrintDebug("### timeout before final event posted")
            ' clear
	        a=RebootSystem()
            stop
        else if type(msg) = "roUrlEvent" then
    	    if msg.GetSourceIdentity() = eventURL.GetIdentity() then
	    	    if msg.GetResponseCode() = 200 then
            	    a=RebootSystem()
                endif
            endif
        endif

        m.diagnostics.PrintDebug("### unexpected event while waiting to reboot")
        unexpectedUrlEventCount = unexpectedUrlEventCount + 1
        if unexpectedUrlEventCount > 5 then
            m.diagnostics.PrintDebug("### reboot due to too many url events while waiting to reboot")
            ' clear
            a=RebootSystem()
        endif

    endwhile

    RebootSystem()

    return

End Sub


Sub SendDeviceError(event$ As String, name$ As String, failureReason$ As String, responseCode$ As String)

    m.diagnostics.PrintDebug("### send_device_error")
	if not m.deviceErrorURL.SetUrl(m.device_error_url$) then
		' Must be active asynchronously. Let's wait a bit and try again.
		wait(500, 0)
		if not m.deviceErrorURL.SetUrl(m.device_error_url$) then
			return
		end if
	end if
	
	m.deviceErrorURL.SetHeaders({})
    m.deviceErrorURL.AddHeader("account", m.account$)
''    m.deviceErrorURL.AddHeader("user", m.user$)
''    m.deviceErrorURL.AddHeader("password", m.password$)
    m.deviceErrorURL.AddHeader("DeviceID", m.deviceUniqueID$)
        
    e1$ = m.deviceErrorURL.Escape(event$)
    e2$ = m.deviceErrorURL.Escape(name$)
    e3$ = m.deviceErrorURL.Escape(responseCode$)
    e4$ = m.deviceErrorURL.Escape(failureReason$)
    
    errorStr$ = "ErrorEvent=" + e1$ + "&ErrorName=" + e2$ + "&ResponseCode=" + e3$  + "&FailureReason=" + e4$

	m.deviceErrorURL.AsyncPostFromString(errorStr$)

End Sub



Function UploadTrafficDownload(contentDownloaded# As Double) As Boolean

    if m.trafficDownloadURL$ = "" then
        m.diagnostics.PrintDebug("### UploadTrafficDownload - trafficDownloadURL not set, return")
        return false
    else
        m.diagnostics.PrintDebug("### UploadTrafficDownload")
    endif
    
' if a transfer is in progress, return
	if not m.trafficDownloadUploadURL.SetUrl(m.trafficDownloadURL$) then
        m.diagnostics.PrintDebug("### UploadTrafficDownload - upload already in progress")
		return false
	end if

    m.lastContentDownloaded# = contentDownloaded#
    
    if type(m.newSync) <> "roSyncSpec" then
        m.diagnostics.PrintDebug("### UploadTrafficDownload - m.newSync not set, return")
        return false
    endif

' convert contentDownloaded# to contentDownloaded in KBytes which can be stored in an integer
	contentDownloaded% = m.contentDownloaded# / 1024
	
	m.trafficDownloadUploadURL.SetHeaders(m.newSync.GetMetadata("server"))
    m.trafficDownloadUploadURL.AddHeader("DeviceID", m.deviceUniqueID$)
' remove the following line after the server code is installed.    
    m.trafficDownloadUploadURL.AddHeader("contentDownloaded", StripLeadingSpaces(stri(m.contentDownloaded#)))    
    m.trafficDownloadUploadURL.AddHeader("contentDownloadedInKBytes", StripLeadingSpaces(stri(contentDownloaded%)))    
    m.trafficDownloadUploadURL.AddHeader("DeviceFWVersion", "")
    m.trafficDownloadUploadURL.AddHeader("DeviceSWVersion", "recovery.brs " + m.setupVersion$)
    m.trafficDownloadUploadURL.AddHeader("timezone", m.systemTime.GetTimeZone())
    m.trafficDownloadUploadURL.AddHeader("utcTime", m.systemTime.GetUtcDateTime().GetString())

	if m.multipleNetworkInterfaceFunctionsExist then
		m.diagnostics.PrintDebug("### binding for UploadTrafficDownload is " + stri(m.contentXfersBinding%))
		ok = m.trafficDownloadUploadURL.BindToInterface(m.contentXfersBinding%)
		if not ok then stop
	endif

	ok = m.trafficDownloadUploadURL.AsyncPostFromString("UploadTrafficDownload")
	if not ok then
        m.diagnostics.PrintDebug("### UploadTrafficDownload - AsyncPostFromString failed")
	endif	

    return ok
    
End Function


Sub URLTrafficDownloadXferEvent(msg as Object)

	if msg.GetInt() = m.URL_EVENT_COMPLETE then
	    
        m.diagnostics.PrintDebug("###  URLTrafficDownloadXferEvent: " + stri(msg.GetResponseCode()))

	    if msg.GetResponseCode() = 200 then

            m.trafficUploadComplete = true
            return
        
        else

            ok = m.UploadTrafficDownload(m.lastContentDownloaded#)
        
        endif
        
    endif
        
End Sub


Function StripLeadingSpaces(inputString$ As String) As String

    while true
        if left(inputString$, 1)<>" " then return inputString$
        inputString$ = right(inputString$, len(inputString$)-1)
    endwhile

    return inputString$

End Function


Sub DisplayDownloadMessage()

    mode=CreateObject("roVideoMode")
    CHARWIDTH=16
    CHARHEIGHT=16
    tfWidth=cint(mode.GetResX()/CHARWIDTH)
    tfHeight=cint(mode.GetResY()/CHARHEIGHT)

    meta=CreateObject("roAssociativeArray")
    meta.AddReplace("CharWidth",CHARWIDTH)
    meta.AddReplace("CharHeight",CHARHEIGHT)
    meta.AddReplace("BackgroundColor",&H000000)   'black
    meta.AddReplace("TextColor",&H00FFFFFF)   ' white
    tf=CreateObject("roTextField",0,0,tfWidth,tfHeight,meta)
    if type(tf)<>"roTextField" then
        print "unable to create roTextField"
        stop
    endif

    tf.SetSendEol(chr(13)+chr(10))

    tf.SetCursorPos(5, 5)
    print #tf, "Downloading content"

    return

End Sub

REM *******************************************************
REM *******************************************************
REM ***************                    ********************
REM *************** LOGGING OBJECT     ********************
REM ***************                    ********************
REM *******************************************************
REM *******************************************************

REM
REM construct a new logging BrightScript object
REM
Function newLogging() As Object

    logging = CreateObject("roAssociativeArray")
    
    logging.msgPort = m.msgPort
    logging.systemTime = m.systemTime
    logging.diagnostics = m.diagnostics
    
    logging.SetSystemInfo = NetworkingSetSystemInfo

    logging.registrySection = CreateObject("roRegistrySection", "networking")
    if type(logging.registrySection) <> "roRegistrySection" then print "Error: Unable to create roRegistrySection":stop
    logging.CreateLogFile = CreateLogFile
    logging.MoveExpiredCurrentLog = MoveExpiredCurrentLog
    logging.MoveCurrentLog = MoveCurrentLog
    logging.InitializeLogging = InitializeLogging
    logging.ReinitializeLogging = ReinitializeLogging
    logging.InitializeCutoverTimer = InitializeCutoverTimer
    logging.WritePlaybackLogEntry = WritePlaybackLogEntry
    logging.WriteEventLogEntry = WriteEventLogEntry
    logging.WriteDiagnosticLogEntry = WriteDiagnosticLogEntry
    logging.PushLogFile = PushLogFile
    logging.CutoverLogFile = CutoverLogFile
    logging.HandleTimerEvent = HandleLoggingTimerEvent
    logging.PushLogFilesOnBoot = PushLogFilesOnBoot
    logging.OpenOrCreateCurrentLog = OpenOrCreateCurrentLog
    logging.DeleteExpiredFiles = DeleteExpiredFiles
    logging.DeleteOlderFiles = DeleteOlderFiles
    logging.FlushLogFile = FlushLogFile
    logging.logFile = invalid
    
    logging.uploadLogFolder = "logs"
    logging.uploadLogArchiveFolder = "archivedLogs"
    logging.uploadLogFailedFolder = "failedLogs"
    logging.logFileUpload = invalid
    
    logging.playbackLoggingEnabled = false
    logging.eventLoggingEnabled = false
    logging.diagnosticLoggingEnabled = false
    logging.stateLoggingEnabled = false
	logging.variableLoggingEnabled = false
    logging.uploadLogFilesAtBoot = false
    logging.uploadLogFilesAtSpecificTime = false
    logging.uploadLogFilesTime% = 0
    
    CreateDirectory("logs")
    CreateDirectory("currentLog")
    CreateDirectory("archivedLogs")
    CreateDirectory("failedLogs")

    return logging
    
End Function


Function CreateLogFile(logDateKey$ As String, logCounterKey$ As String) As Object

    dtLocal = m.systemTime.GetLocalDateTime()
    year$ = Right(stri(dtLocal.GetYear()), 2)
    month$ = StripLeadingSpaces(stri(dtLocal.GetMonth()))
    if len(month$) = 1 then
        month$ = "0" + month$
    endif
    day$ = StripLeadingSpaces(stri(dtLocal.GetDay()))
    if len(day$) = 1 then
        day$ = "0" + day$
    endif
    dateString$ = year$ + month$ + day$
    
    logDate$ = m.registrySection.Read(logDateKey$)
    logCounter$ = m.registrySection.Read(logCounterKey$)
    
    if logDate$ = "" or logCounter$ = "" then
        logCounter$ = "000"
    else if logDate$ <> dateString$ then
        logCounter$ = "000"
    endif
    logDate$ = dateString$
    
    localFileName$ = "BrightSign" + "Log." + m.deviceUniqueID$ + "-" + dateString$ + logCounter$ + ".log"

' at a later date, move this code to the point where the file has been uploaded successfully
    m.registrySection.Write(logDateKey$, logDate$)
    
    logCounter% = val(logCounter$)
    logCounter% = logCounter% + 1
    if logCounter% > 999 then
        logCounter% = 0
    endif
    logCounter$ = StripLeadingSpaces(stri(logCounter%))
    if len(logCounter$) = 1 then
        logCounter$ = "00" + logCounter$
    else if len(logCounter$) = 2 then
        logCounter$ = "0" + logCounter$
    endif
    m.registrySection.Write(logCounterKey$, logCounter$)
 
    fileName$ = "currentLog/" + localFileName$
    logFile = CreateObject("roCreateFile", fileName$)
    m.diagnostics.PrintDebug("Create new log file " + localFileName$)
    
    t$ = chr(9)
    
    ' version
    header$ = "BrightSignLogVersion"+t$+"2"
    logFile.SendLine(header$)
    
    ' serial number
    header$ = "SerialNumber"+t$+m.deviceUniqueID$
    logFile.SendLine(header$)
    
    ' account, group
    header$ = "Account"+t$+m.networking.account$
    logFile.SendLine(header$)
    header$ = "Group"+t$+m.networking.group$
    logFile.SendLine(header$)
    
    ' timezone
    header$ = "Timezone"+t$+m.systemTime.GetTimeZone()
    logFile.SendLine(header$)

    ' timestamp of log creation
    header$ = "LogCreationTime"+t$+m.systemTime.GetLocalDateTime().GetString()
    logFile.SendLine(header$)
    
    ' ip address
    nc = CreateObject("roNetworkConfiguration", 0)
    if type(nc) = "roNetworkConfiguration" then
        currentConfig = nc.GetCurrentConfig()
        nc = invalid
        ipAddress$ = currentConfig.ip4_address
        header$ = "IPAddress"+t$+ipAddress$
        logFile.SendLine(header$)
    endif
    
    ' fw version
    header$ = "FWVersion"+t$+m.deviceFWVersion$
    logFile.SendLine(header$)
    
    ' script version
    header$ = "ScriptVersion"+t$+m.setupVersion$
    logFile.SendLine(header$)

    ' custom script version
    header$ = "CustomScriptVersion"+t$+""
    logFile.SendLine(header$)

    ' model
    header$ = "Model"+t$+m.deviceModel$
    logFile.SendLine(header$)

    logFile.AsyncFlush()
    
    return logFile
    
End Function


Sub MoveExpiredCurrentLog()

    dtLocal = m.systemTime.GetLocalDateTime()
    currentDate$ = StripLeadingSpaces(stri(dtLocal.GetDay()))
    if len(currentDate$) = 1 then
        currentDate$ = "0" + currentDate$
    endif

    listOfPendingLogFiles = MatchFiles("/currentLog", "*")
        
    for each file in listOfPendingLogFiles
    
        logFileDate$ = left(right(file, 9), 2)
    
        if logFileDate$ <> currentDate$ then
            sourceFilePath$ = "currentLog/" + file
            destinationFilePath$ = "logs/" + file
            CopyFile(sourceFilePath$, destinationFilePath$)
            DeleteFile(sourceFilePath$)
        endif
        
    next

End Sub


Sub MoveCurrentLog()

    listOfPendingLogFiles = MatchFiles("/currentLog", "*")
    for each file in listOfPendingLogFiles
        sourceFilePath$ = "currentLog/" + file
        destinationFilePath$ = "logs/" + file
        CopyFile(sourceFilePath$, destinationFilePath$)
        DeleteFile(sourceFilePath$)
    next
    
End Sub


Sub InitializeLogging(playbackLoggingEnabled As Boolean, eventLoggingEnabled As Boolean, diagnosticLoggingEnabled As Boolean, uploadLogFilesAtBoot As Boolean, uploadLogFilesAtSpecificTime As Boolean, uploadLogFilesTime% As Integer)

    m.DeleteExpiredFiles()
    
    m.playbackLoggingEnabled = playbackLoggingEnabled
    m.eventLoggingEnabled = eventLoggingEnabled
    m.diagnosticLoggingEnabled = diagnosticLoggingEnabled
    m.uploadLogFilesAtBoot = uploadLogFilesAtBoot
    m.uploadLogFilesAtSpecificTime = uploadLogFilesAtSpecificTime
    m.uploadLogFilesTime% = uploadLogFilesTime%

    m.loggingEnabled = playbackLoggingEnabled or eventLoggingEnabled or diagnosticLoggingEnabled
    m.uploadLogsEnabled = uploadLogFilesAtBoot or uploadLogFilesAtSpecificTime  
     
    if m.uploadLogFilesAtBoot then
        m.PushLogFilesOnBoot()
    endif
    
    m.MoveExpiredCurrentLog()

    if m.loggingEnabled then m.OpenOrCreateCurrentLog()
    
    m.InitializeCutoverTimer()
    
End Sub


Sub ReinitializeLogging(playbackLoggingEnabled As Boolean, eventLoggingEnabled As Boolean, diagnosticLoggingEnabled As Boolean, uploadLogFilesAtBoot As Boolean, uploadLogFilesAtSpecificTime As Boolean, uploadLogFilesTime% As Integer)

    if playbackLoggingEnabled = m.playbackLoggingEnabled and eventLoggingEnabled = m.eventLoggingEnabled and diagnosticLoggingEnabled = m.diagnosticLoggingEnabled and uploadLogFilesAtBoot = m.uploadLogFilesAtBoot and uploadLogFilesAtSpecificTime = m.uploadLogFilesAtSpecificTime and uploadLogFilesTime% = m.uploadLogFilesTime% then return
    
    if type(m.cutoverTimer) = "roTimer" then
        m.cutoverTimer.Stop()
        m.cutoverTimer = invalid
    endif

    m.playbackLoggingEnabled = playbackLoggingEnabled
    m.eventLoggingEnabled = eventLoggingEnabled
    m.diagnosticLoggingEnabled = diagnosticLoggingEnabled
    m.uploadLogFilesAtBoot = uploadLogFilesAtBoot
    m.uploadLogFilesAtSpecificTime = uploadLogFilesAtSpecificTime
    m.uploadLogFilesTime% = uploadLogFilesTime%

    m.loggingEnabled = playbackLoggingEnabled or eventLoggingEnabled or diagnosticLoggingEnabled
    m.uploadLogsEnabled = uploadLogFilesAtBoot or uploadLogFilesAtSpecificTime  

    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" and m.loggingEnabled then
        m.OpenOrCreateCurrentLog()
    endif
            
    m.InitializeCutoverTimer()

End Sub


Sub InitializeCutoverTimer()

    if m.uploadLogFilesAtSpecificTime then
        hour% = m.uploadLogFilesTime% / 60
        minute% = m.uploadLogFilesTime% - (hour% * 60)
    else if not m.uploadLogsEnabled then
        hour% = 0
        minute% = 0
    endif
    
    if m.uploadLogFilesAtSpecificTime or not m.uploadLogsEnabled then
        m.cutoverTimer = CreateObject("roTimer")
        m.cutoverTimer.SetPort(m.msgPort)
        m.cutoverTimer.SetDate(-1, -1, -1)
        m.cutoverTimer.SetTime(hour%, minute%, 0, 0)
        m.cutoverTimer.Start()    
    endif
    
End Sub


Sub DeleteExpiredFiles()

    ' delete any files that are more than 10 days old
    
    dtExpired = m.systemTime.GetLocalDateTime()
    dtExpired.SubtractSeconds(60 * 60 * 24 * 10)
    
    ' look in the following folders
    '   logs
    '   failedLogs
    '   archivedLogs
    
    m.DeleteOlderFiles("logs", dtExpired)
    m.DeleteOlderFiles("failedLogs", dtExpired)
    m.DeleteOlderFiles("archivedLogs", dtExpired)
    
End Sub


Sub DeleteOlderFiles(folderName$ As String, dtExpired As Object)

    listOfLogFiles = MatchFiles("/" + folderName$, "*")
        
    for each file in listOfLogFiles
    
        year$ = "20" + left(right(file,13), 2)
        month$ = left(right(file,11), 2)
        day$ = left(right(file, 9), 2)
        dtFile = CreateObject("roDateTime")
        dtFile.SetYear(int(val(year$)))
        dtFile.SetMonth(int(val(month$)))
        dtFile.SetDay(int(val(day$)))
               
        if dtFile < dtExpired then
            fullFilePath$ = "/" + folderName$ + "/" + file
            m.diagnostics.PrintDebug("Delete expired log file " + fullFilePath$)
            DeleteFile(fullFilePath$)
        endif
        
    next

End Sub


Sub FlushLogFile()

    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    m.logFile.Flush()

End Sub


Sub WritePlaybackLogEntry(zoneName$ As String, startTime$ As String, endTime$ As String, itemType$ As String, fileName$ As String)

    if not m.playbackLoggingEnabled then return
    
    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    t$ = chr(9) 
    m.logFile.SendLine("L=p"+t$+"Z="+zoneName$+t$+"S="+startTime$+t$+"E="+endTime$+t$+"I="+itemType$+t$+"N="+fileName$)
    m.logFile.AsyncFlush()

End Sub


Sub WriteEventLogEntry(zoneName$ As String, timestamp$ As String, eventType$ As String, eventData$ As String)

    if not m.eventLoggingEnabled then return

    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    t$ = chr(9) 
    m.logFile.SendLine("L=e"+t$+"Z="+zoneName$+t$+"T="+timestamp$+t$+"E="+eventType$+t$+"D="+eventData$)
    m.logFile.AsyncFlush()

End Sub


Sub WriteDiagnosticLogEntry(eventId$ As String, eventData$ As String)

    if not m.diagnosticLoggingEnabled then return

    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    timestamp$ = m.systemTime.GetLocalDateTime().GetString()

    t$ = chr(9) 
    m.logFile.SendLine("L=d"+t$+"T="+timestamp$+t$+"I="+eventId$+t$+"D="+eventData$)
    m.logFile.AsyncFlush()
    
End Sub


Sub PushLogFile(forceUpload As Boolean)

    if not m.uploadLogsEnabled and not forceUpload then return
    
' files that failed to upload in the past were moved to a different folder. move them back to the appropriate folder so that the script can attempt to upload them again
    listOfFailedLogFiles = MatchFiles("/" + m.uploadLogFailedFolder, "*.log")
    for each file in listOfFailedLogFiles
        target$ = m.uploadLogFolder + "/" + file
        fullFilePath$ = m.uploadLogFailedFolder + "/" + file
        ok = MoveFile(fullFilePath$, target$)
    next

    m.networking.UploadLogFiles()
    
End Sub


Sub PushLogFilesOnBoot()

    m.MoveCurrentLog()
    m.PushLogFile(false)

End Sub


Sub HandleLoggingTimerEvent(msg As Object)

    m.CutoverLogFile(false)

    m.cutoverTimer.Start()

End Sub


Sub CutoverLogFile(forceUpload As Boolean)

    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    m.logFile.Flush()
    m.MoveCurrentLog()
    m.logFile = m.CreateLogFile("ld", "lc")

    m.PushLogFile(forceUpload)
    
End Sub


Sub OpenOrCreateCurrentLog()

' if there is an existing log file for today, just append to it. otherwise, create a new one to use

    listOfPendingLogFiles = MatchFiles("/currentLog", "*")
    
    for each file in listOfPendingLogFiles
        fileName$ = "currentLog/" + file
        m.logFile = CreateObject("roAppendFile", fileName$)
        if type(m.logFile) = "roAppendFile" then
            m.diagnostics.PrintDebug("Use existing log file " + file)
            return
        endif
    next

    m.logFile = m.CreateLogFile("ld", "lc")
    
End Sub


REM *******************************************************
REM *******************************************************
REM ***************                    ********************
REM *************** DIAGNOSTIC CODES   ********************
REM ***************                    ********************
REM *******************************************************
REM *******************************************************

Function newDiagnosticCodes() As Object

    diagnosticCodes = CreateObject("roAssociativeArray")
    
    diagnosticCodes.EVENT_STARTUP                               = "1000"
    diagnosticCodes.EVENT_SYNCSPEC_RECEIVED                     = "1001"
    diagnosticCodes.EVENT_DOWNLOAD_START                        = "1002"
    diagnosticCodes.EVENT_FILE_DOWNLOAD_START                   = "1003"
    diagnosticCodes.EVENT_FILE_DOWNLOAD_COMPLETE                = "1004"
    diagnosticCodes.EVENT_DOWNLOAD_COMPLETE                     = "1005"
    diagnosticCodes.EVENT_READ_SYNCSPEC_FAILURE                 = "1006"
    diagnosticCodes.EVENT_RETRIEVE_SYNCSPEC_FAILURE             = "1007"
    diagnosticCodes.EVENT_NO_SYNCSPEC_AVAILABLE                 = "1008"
    diagnosticCodes.EVENT_SYNCSPEC_DOWNLOAD_IMMEDIATE_FAILURE   = "1009"
    diagnosticCodes.EVENT_FILE_DOWNLOAD_FAILURE                 = "1010"
    diagnosticCodes.EVENT_SYNCSPEC_DOWNLOAD_FAILURE             = "1011"
    diagnosticCodes.EVENT_SYNCPOOL_PROTECT_FAILURE              = "1012"
    diagnosticCodes.EVENT_LOGFILE_UPLOAD_FAILURE                = "1013"
    diagnosticCodes.EVENT_SYNC_ALREADY_ACTIVE                   = "1014"
    diagnosticCodes.EVENT_CHECK_CONTENT                         = "1015"
    diagnosticCodes.EVENT_FILE_DOWNLOAD_PROGRESS                = "1016"
    diagnosticCodes.EVENT_FIRMWARE_DOWNLOAD                     = "1017"
    diagnosticCodes.EVENT_SCRIPT_DOWNLOAD                       = "1018"
	diagnosticCodes.EVENT_REALIZE_FAILURE						= "1032"
    
    return diagnosticCodes
    
End Function

