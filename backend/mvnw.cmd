@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script, version 3.3.2
@REM ----------------------------------------------------------------------------

@ECHO OFF
SETLOCAL

set MAVEN_PROJECTBASEDIR=%~dp0
IF "%MAVEN_PROJECTBASEDIR%"=="" SET MAVEN_PROJECTBASEDIR=.
set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"

IF NOT EXIST %WRAPPER_JAR% (
  ECHO Maven wrapper JAR missing: %WRAPPER_JAR%
  EXIT /B 1
)

IF "%JAVA_HOME%"=="" (
  ECHO JAVA_HOME is not set. Please set JAVA_HOME to a JDK installation.
  EXIT /B 1
)

set JAVA_EXE="%JAVA_HOME%\bin\java.exe"
IF NOT EXIST %JAVA_EXE% (
  ECHO java.exe not found at: %JAVA_EXE%
  EXIT /B 1
)

%JAVA_EXE% -classpath %WRAPPER_JAR% -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" ^
  org.apache.maven.wrapper.MavenWrapperMain -Dmaven.home="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper" ^
  -Dwrapper.properties=%WRAPPER_PROPERTIES% %*

ENDLOCAL
