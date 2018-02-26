Library "setupCommon.brs"
Library "setupNetworkDiagnostics.brs"

Sub Main()

    ' Local setup script
    version="8.0.0.1"
    print "localSetup.brs version ";version;" started"

    modelSupportsWifi = GetModelSupportsWifi()

	CheckFirmwareVersion()

	' Load up the sync specification
	localToStandaloneSyncSpec = false
	setup_sync = CreateObject("roSyncSpec")

    if setup_sync.ReadFromFile("setup.json") then
        setupParams = ParseAutoplay(setup_sync)
	else
' BACONTODO
	    stop
		print "### No local sync state available"
		if not setup_sync.ReadFromFile("localSetupToStandalone-sync.xml") stop
		localToStandaloneSyncSpec = true
	endif

    if setupParams.lwsConfig$ = "content" then
		CheckStorageDeviceIsWritable()
	endif

    registrySection = CreateObject("roRegistrySection", "networking")
    if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection":stop

	ClearRegistryKeys(registrySection)
    
	' retrieve and parse featureMinRevs.xml
	featureMinRevs = ParseFeatureMinRevs()

    ' write identifying data to registry
    registrySection.Write("tz", setupParams.timezone$)
    registrySection.Write("un", setupParams.unitName$)
    registrySection.Write("unm", setupParams.unitNamingMethod$)
    registrySection.Write("ud", setupParams.unitDescription$)
	
	if Len(setupParams.configVersion$) > 0 then
		registrySection.Write("cfv", setupParams.configVersion$)
	end if

	' network host parameters
	proxySpec$ = GetProxy(setupParams, registrySection)
	bypassProxyHosts = GetBypassProxyHosts(proxySpec$, setup_sync)

	registrySection.Write("ts", setupParams.timeServer$)
	print "time server in localSetup.brs = ";setupParams.timeServer$

' Hostname
    SetHostname(setupParams.specifyHostname, setupParams.hostName$)

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

' set the time zone
    if setupParams.timezone$ <> "" then
        systemTime = CreateObject("roSystemTime")
        systemTime.SetTimeZone(setupParams.timezone$)
        systemTime = invalid
    endif

' diagnostic web server
	SetDWS(setupParams, registrySection)

' usb content update password
	usbUpdatePassphrase$ = setupParams.usbUpdatePassword$
	if usbUpdatePassphrase$ = "" then
		registrySection.Delete("uup")
	else
       registrySection.Write("uup", usbUpdatePassphrase$)
	endif

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

' clear uploadlogs handler
    registrySection.Write("ul", "")
    
    registrySection.Flush()

' perform network diagnostics if enabled
	if setupParams.networkDiagnosticsEnabled then
		PerformNetworkDiagnostics(setupParams.testEthernetEnabled, setupParams.testWirelessEnabled, setupParams.testInternetEnabled)
	endif

' setup complete - wrap it up

    videoMode = CreateObject("roVideoMode")
    resX = videoMode.GetResX()
    resY = videoMode.GetResY()
    videoMode = invalid

    if setupParams.lwsConfig$ = "content" then

        MoveFile("pending-autorun.brs", "autorun.brs")

		r=CreateObject("roRectangle",0,resY/2-resY/32,resX,resY/32)
		twParams = CreateObject("roAssociativeArray")
		twParams.LineCount = 1
		twParams.TextMode = 2
		twParams.Rotation = 0
		twParams.Alignment = 1
		tw=CreateObject("roTextWidget",r,1,2,twParams)
		tw.PushString("Local File Networking Setup is complete")
		tw.Show()

		r2=CreateObject("roRectangle",0,resY/2,resX,resY/32)
		tw2=CreateObject("roTextWidget",r2,1,2,twParams)
		tw2.PushString("The device will be ready for content downloads after it completes rebooting")
		tw2.Show()

		Sleep(30000)

        ' reboot
        a=RebootSystem()
        stop
        
	else if localToStandaloneSyncSpec then

        MoveFile("pending-autorun.brs", "autorun.brs")
		RestartScript()

    else

        r=CreateObject("roRectangle",0,resY/2-resY/64,resX,resY/32)
        twParams = CreateObject("roAssociativeArray")
        twParams.LineCount = 1
        twParams.TextMode = 2
        twParams.Rotation = 0
        twParams.Alignment = 1
        tw=CreateObject("roTextWidget",r,1,2,twParams)
        tw.PushString("Standalone Setup is complete - you may now remove the card")
        tw.Show()

        msgPort = CreateObject("roMessagePort")
        
        while true
            wait(0, msgPort)
        end while

    endif
    
End Sub


Function ParseAutoplay(setup_sync As Object) As Object

    setupParams = {}

    ParseAutoplayCommon(setupParams, setup_sync)

    return setupParams

End Function

