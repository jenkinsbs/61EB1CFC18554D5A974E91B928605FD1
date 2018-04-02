Library "setupCommon.brs"
Library "setupNetworkDiagnostics.brs"

Sub Main()

	' Script to read the relevant information from a sync spec and write it to the registry
	version="8.0.0.1"
	print "setup.brs version ";version;" started"

	modelSupportsWifi = GetModelSupportsWifi()

	CheckFirmwareVersion()

	CheckStorageDeviceIsWritable()

	registrySection = CreateObject("roRegistrySection", "networking")
	if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection":stop

	ClearRegistryKeys(registrySection)

	' retrieve and parse featureMinRevs.json
	featureMinRevs = ParseFeatureMinRevs()

	' Load up the current sync specification
	localToBSNSyncSpec = false
	current_sync = CreateObject("roSyncSpec")
	if not current_sync.ReadFromFile("current-sync.json") then
		print "### No current sync state available"
		if not current_sync.ReadFromFile("localToBSN-sync.json") stop
		localToBSNSyncSpec = true
	endif
  setupParams = ParseAutoplay(current_sync)

	' indicate to recovery_runsetup_ba.brs that this is a setup operation
	registrySection.Write("su","yes")

	' indicate version number
	registrySection.Write("v", "1")

	' write identifying data to registry
	' TODO - enableUnsafeAuthentication?'
	registrySection.Write("a", setupParams.account)
	registrySection.Write("bsnrt", setupParams.bsnRegistrationToken)
	registrySection.Write("u", setupParams.user)
	registrySection.Write("p", setupParams.password)
	registrySection.Write("g", setupParams.group)
  registrySection.Write("tz", setupParams.timezone$)
  registrySection.Write("un", setupParams.unitName$)
  registrySection.Write("unm", setupParams.unitNamingMethod$)
  registrySection.Write("ud", setupParams.unitDescription$)
  registrySection.Write("tbnc", GetNumericStringFromNumber(setupParams.timeBetweenNetConnects%))

  registrySection.Write("cdr", GetYesNoFromBoolean(setupParams.contentDownloadsRestricted))
  registrySection.Write("cdrs", GetNumericStringFromNumber(setupParams.contentDownloadRangeStart%))
  registrySection.Write("cdrl", GetNumericStringFromNumber(setupParams.contentDownloadRangeLength%))

  registrySection.Write("tbh", GetNumericStringFromNumber(setupParams.timeBetweenHeartbeats%))

  heartbeatsRestricted = GetYesNoFromBoolean(setupParams.heartbeatsRestricted)
	registrySection.Write("hr", heartbeatsRestricted)
	if heartbeatsRestricted = "yes" then
    registrySection.Write("hrs", GetNumericStringFromNumber(setupParams.heartbeatsRangeStart%))
    registrySection.Write("hrl", GetNumericStringFromNumber(setupParams.heartbeatsRangeLength%))
	endif

	' network host parameters
	proxySpec$ = GetProxy(setupParams, registrySection)
	bypassProxyHosts = GetBypassProxyHosts(proxySpec$, setupParams)

	registrySection.Write("ts", setupParams.timeServer$)
	print "time server in localSetup.brs = ";setupParams.timeServer$

' Hostname
  SetHostname(setupParams.specifyHostname, setupParams.hostName$)

	' write networkHosts string to registry
	if proxySpec$ <> "" then
		networkHosts$ = setupParams.networkHosts
		registrySection.Write("bph", networkHosts$)
	else
		registrySection.Write("bph", "")
	endif

' Wireless parameters
    useWireless = SetWirelessParameters(setupParams, registrySection, modelSupportsWifi)

' Wired parameters
    SetWiredParameters(setupParams, registrySection, useWireless)

' Network configurations
    if setupParams.useWireless then
        if modelSupportsWifi then
			wifiNetworkingParameters = SetNetworkConfiguration(setupParams, registrySection, "", "")
			ethernetNetworkingParameters = SetNetworkConfiguration(setupParams, registrySection, "_2", "2")
        else
			' if the user specified wireless but the system doesn't support it, use the parameters specified for wired (the secondary parameters)
			ethernetNetworkingParameters = SetNetworkConfiguration(setupParams, registrySection, "_2", "")
        endif
    else
    	ethernetNetworkingParameters = SetNetworkConfiguration(setupParams, registrySection, "", "")
    endif

' Network connection priorities
	networkConnectionPriorityWired% = setupParams.networkConnectionPriorityWired%
    networkConnectionPriorityWireless% = setupParams.networkConnectionPriorityWireless%

' configure ethernet
	ConfigureEthernet(ethernetNetworkingParameters, networkConnectionPriorityWired%, setupParams.timeServer$, proxySpec$, bypassProxyHosts, featureMinRevs)

' configure wifi if specified and device supports wifi
	if useWireless
		ConfigureWifi(wifiNetworkingParameters, setupParams.ssid$, setupParams.passphrase$, networkConnectionPriorityWireless%, setupParams.timeServer$, proxySpec$, bypassProxyHosts, featureMinRevs)
	endif

' if a device is setup to not use wireless, ensure that wireless is not used (for wireless model only)
	if not useWireless and modelSupportsWifi then
		DisableWireless()
	endif

' TODO - not in old setup.brs - ??'
' set the time zone
'    if setupParams.timezone$ <> "" then
'        systemTime = CreateObject("roSystemTime")
''        systemTime.SetTimeZone(setupParams.timezone$)
''        systemTime = invalid
''    endif

' diagnostic web server
	SetDWS(setupParams, registrySection)

' local web server
	SetLWS(setupParams, registrySection)

' logging
	SetLogging(setupParams, registrySection)

' remote snapshot
	SetRemoteSnapshot(setupParams, registrySection)

' idle screen color
	SetIdleColor(setupParams, registrySection)

' custom splash screen
	SetCustomSplashScreen(setupParams, registrySection, featureMinRevs)

' beacons
	SetBeacons(setupParams, registrySection, featureMinRevs)

' BrightWall
	registrySection.Write("brightWallName", setupParams.brightWallName)
	registrySection.Write("brightWallScreenNumber", setupParams.brightWallScreenNumber)

' handlers    
	registrySection.Write("ub", setupParams.base)
	registrySection.Write("ru", setupParams.recoveryHandler)
	registrySection.Write("rs", setupParams.recoverySetup)
	registrySection.Write("nu", setupParams.next)
	registrySection.Write("vu", setupParams.event)
	registrySection.Write("eu", setupParams.error)
	registrySection.Write("de", setupParams.deviceError)
	registrySection.Write("dd", setupParams.deviceDownload)
	registrySection.Write("dp", setupParams.deviceDownloadProgress)
	registrySection.Write("td", setupParams.trafficDownload)
	registrySection.Write("ul", setupParams.uploadLogs)
	registrySection.Write("bs", setupParams.batteryCharger)
	registrySection.Write("hh", setupParams.heartbeat)

  registrySection.Flush()

	wiredDataTransferEnabled = setupParams.contentDataTypeEnabledWired
	wirelessDataTransferEnabled = setupParams.contentDataTypeEnabledWireless
	binding% = GetBinding(wiredDataTransferEnabled, wirelessDataTransferEnabled)

' perform network diagnostics if enabled
	if setupParams.networkDiagnosticsEnabled then
		PerformNetworkDiagnostics(setupParams.testEthernetEnabled, setupParams.testWirelessEnabled, setupParams.testInternetEnabled)
	endif

' setup complete - get script from server

	numRetries% = 0
	while numRetries% < 10

		' get bootup script from server
		xfer = CreateObject("roUrlTransfer")
		recurl = setupParams.base + setupParams.recoverySetup
		print "### Looking for file from "; recurl
		xfer.BindToInterface(binding%)
		xfer.SetUrl(recurl)

		response_code = xfer.GetToFile("autorun.tmp")
		print "### xfer to card response code = "; response_code
		if response_code=200 then
			MoveFile("autorun.tmp", "autorun.brs")
			' reboot
			a=RebootSystem()
			stop
		else
			sw = CreateObject("roGpioControlPort")

			for flash_index=0 to 9
				sw.SetWholeState(2^1 + 2^2 + 2^3 + 2^4 + 2^5 + 2^6 + 2^7 + 2^8 + 2^9 + 2^10)
				sleep(500)
				sw.SetWholeState(0)
				sleep(500)
			next
		endif
		numRetries% = numRetries% + 1
		    
	end while

	' if appropriate, play standalone content
	if localToBSNSyncSpec then
		MoveFile("pending-autorun.brs", "autorun.brs")
	endif

	' reboot
	a=RebootSystem()
	stop

End Sub


Function ParseAutoplay(setup_sync As Object) As Object

    setupParams = {}

    ParseAutoplayCommon(setupParams, setup_sync)

    return setupParams

End Function

