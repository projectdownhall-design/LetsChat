; LetsChat Installer - Inno Setup 6 Script
; Modernes Design mit WhatsApp-Farbschema

#define AppName "LetsChat"
#define AppVersion "1.0.0"
#define AppPublisher "LetsChat Team"
#define AppURL "https://github.com/letschat/letschat"
#define AppExeName "LetsChat.exe"
#define AppId "{{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}"

[Setup]
AppId={#AppId}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}
DefaultDirName={localappdata}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputDir=..\dist-installer
OutputBaseFilename=LetsChat-Setup-v{#AppVersion}
SetupIconFile=assets\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
WizardImageFile=assets\installer-banner.bmp
WizardSmallImageFile=assets\installer-header.bmp
LicenseFile=license.txt
PrivilegesRequired=lowest
DisableWelcomePage=no
DisableReadyMemo=no
DisableDirPage=no
DisableFinishedPage=no
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
VersionInfoVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} Installer
VersionInfoProductName={#AppName}
VersionInfoProductVersion={#AppVersion}
MinVersion=10.0.17763
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
; Custom colors via Pascal scripting
CloseApplications=yes
CloseApplicationsFilter=*.exe
RestartApplications=no

[Languages]
Name: "german"; MessagesFile: "compiler:Languages\German.isl"

[Tasks]
Name: "desktopicon"; Description: "Desktop-&Verknüpfung erstellen"; GroupDescription: "Zusätzliche Symbole:"; Flags: checkedonce
Name: "autostart"; Description: "{#AppName} mit &Windows starten"; GroupDescription: "Systemintegration:"; Flags: unchecked

[Files]
Source: "..\dist-electron\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"
Name: "{group}\{cm:UninstallProgram,{#AppName}}"; Filename: "{uninstallexe}"; IconFilename: "{app}\{#AppExeName}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Registry]
; App registration
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\App Paths\{#AppExeName}"; ValueType: string; ValueName: ""; ValueData: "{app}\{#AppExeName}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\App Paths\{#AppExeName}"; ValueType: string; ValueName: "Path"; ValueData: "{app}"; Flags: uninsdeletekey
; Uninstall registry
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{#AppId}_is1"; ValueType: string; ValueName: "DisplayIcon"; ValueData: "{app}\{#AppExeName}"; Flags: uninsdeletevalue
; Auto-start
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#AppName}"; ValueData: """{app}\{#AppExeName}"""; Tasks: autostart; Flags: uninsdeletevalue

[Run]
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(AppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]

{ ── Farben (BGR-Format für Inno Setup / Windows GDI) ── }
{ Hellere Hintergründe + reines Weiß für besseren Kontrast / Lesbarkeit }
const
  CLR_BG_MAIN     = $2C3E50;   { Haupthintergrund (heller)        }
  CLR_BG_PANEL    = $1B2126;   { Panel-Hintergrund                }
  CLR_ACCENT      = $2A3942;   { Eingabefelder / Bevel            }
  CLR_TEXT_MAIN   = $FFFFFF;   { Primärtext  – reines Weiß        }
  CLR_TEXT_MUTED  = $B0BEC5;   { Gedämpfter Text – heller         }
  CLR_GREEN       = $84A800;   { WhatsApp-Grün  #00A884 (BGR)     }
  CLR_WHITE       = $FFFFFF;

{ ── Wizard-Erscheinungsbild anpassen ── }
procedure InitializeWizard();
begin
  try
    WizardForm.Color                           := CLR_BG_MAIN;
    WizardForm.Font.Color                      := CLR_TEXT_MAIN;
  except
  end;
  try
    WizardForm.MainPanel.Color                 := CLR_BG_PANEL;
  except
  end;
  try
    WizardForm.PageNameLabel.Font.Color        := CLR_TEXT_MAIN;
    WizardForm.PageDescriptionLabel.Font.Color := CLR_TEXT_MUTED;
  except
  end;
  try
    WizardForm.DirEdit.Color                   := CLR_ACCENT;
    WizardForm.DirEdit.Font.Color              := CLR_TEXT_MAIN;
  except
  end;
end;

{ ── Seitenabhängige Texte ── }
procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpWelcome then
  begin
    try
      WizardForm.WelcomeLabel1.Caption := 'Willkommen beim LetsChat Setup';
      WizardForm.WelcomeLabel1.Font.Size := 14;
      WizardForm.WelcomeLabel1.Font.Style := [fsBold];
      WizardForm.WelcomeLabel1.Font.Color := CLR_TEXT_MAIN;
    except
    end;
    try
      WizardForm.WelcomeLabel2.Font.Color := CLR_TEXT_MUTED;
      WizardForm.WelcomeLabel2.Caption :=
        'Dieses Programm installiert {#AppName} Version {#AppVersion} auf Ihrem Computer.'
        + #13#10 + #13#10
        + 'LetsChat ist ein sicherer, Ende-zu-Ende-verschlüsselter Desktop-Messenger '
        + 'für Windows 10 und 11.'
        + #13#10 + #13#10
        + 'Es wird empfohlen, alle anderen Programme zu schließen, bevor Sie die '
        + 'Installation fortsetzen.'
        + #13#10 + #13#10
        + 'Klicken Sie auf Weiter, um fortzufahren.';
    except
    end;
  end;

  if CurPageID = wpFinished then
  begin
    try
      WizardForm.FinishedHeadingLabel.Caption := 'Installation abgeschlossen!';
      WizardForm.FinishedHeadingLabel.Font.Size := 12;
      WizardForm.FinishedHeadingLabel.Font.Style := [fsBold];
      WizardForm.FinishedHeadingLabel.Font.Color := CLR_TEXT_MAIN;
    except
    end;
    try
      WizardForm.FinishedLabel.Font.Color := CLR_TEXT_MUTED;
      WizardForm.FinishedLabel.Caption :=
        '{#AppName} wurde erfolgreich auf Ihrem Computer installiert.'
        + #13#10 + #13#10
        + 'Die Anwendung kann über das Desktop-Symbol oder das Startmenü gestartet werden.'
        + #13#10 + #13#10
        + 'Klicken Sie auf Fertigstellen, um das Setup zu beenden.';
    except
    end;
  end;
end;

{ ── Deinstallation: Nutzerdaten-Abfrage ── }
function InitializeUninstall(): Boolean;
var
  MsgResult: Integer;
begin
  Result := True;
  MsgResult := MsgBox(
    'Möchten Sie auch alle Benutzerdaten (Nachrichten, Einstellungen) löschen?'
    + #13#10
    + 'Wenn Sie "Nein" wählen, bleiben Ihre Daten erhalten.',
    mbConfirmation,
    MB_YESNO
  );
  if MsgResult = IDYES then
  begin
    DelTree(ExpandConstant('{localappdata}\{#AppName}'), True, True, True);
    DelTree(ExpandConstant('{userappdata}\{#AppName}'), True, True, True);
  end;
end;

{ ── Upgrade-Erkennung: vorherige Version deinstallieren ── }
function GetUninstallString(): String;
var
  sUnInstPath: String;
  sUnInstallString: String;
begin
  sUnInstPath := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#AppId}_is1';
  sUnInstallString := '';
  if not RegQueryStringValue(HKCU, sUnInstPath, 'UninstallString', sUnInstallString) then
    RegQueryStringValue(HKLM, sUnInstPath, 'UninstallString', sUnInstallString);
  Result := sUnInstallString;
end;

function IsUpgrade(): Boolean;
begin
  Result := (GetUninstallString() <> '');
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  sUnInstallString: String;
  iResultCode: Integer;
begin
  if (CurStep = ssInstall) and IsUpgrade() then
  begin
    sUnInstallString := RemoveQuotes(GetUninstallString());
    Exec(sUnInstallString, '/SILENT /NORESTART /SUPPRESSMSGBOXES',
         '', SW_HIDE, ewWaitUntilTerminated, iResultCode);
  end;
end;
