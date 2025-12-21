export async function launchAMEWithJobs(jobs, settings) {
  try {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }

    console.log('🟣 launchAMEWithJobs called with', jobs.length, 'jobs')
    jobs.forEach((job, index) => {
      console.log(`   Job ${index}:`, job)

      // Verify preset file exists
      console.log(`   Checking if preset exists: ${job.presetPath}`)
    })

    // Use JSX Script method to add jobs to AME
    // Only works when AME is closed - will return error if AME is already open
    const result = await window.electronAPI.addJobsViaWatchFolder(jobs, settings)

    console.log('AME jobs result:', result)

    // Check if AME is already open
    if (result.error === 'AME_ALREADY_OPEN') {
      const error = new Error(result.message || 'Adobe Media Encoder is already open. Please close AME first, then try again.')
      error.code = 'AME_ALREADY_OPEN'
      throw error
    }

    // Check if destination folders don't exist
    if (result.error === 'FOLDERS_NOT_FOUND') {
      const error = new Error(result.message || 'Destination folder structure does not exist.')
      error.code = 'FOLDERS_NOT_FOUND'
      error.missingFolders = result.missingFolders || []
      throw error
    }

    // Check for other errors
    if (result.error) {
      throw new Error(result.error)
    }

    return result
  } catch (error) {
    console.error('Error launching AME:', error)
    throw error
  }
}

function generateAMEExtendScript(jobs) {
  // Generate ExtendScript code to add jobs to AME queue
  // Uses the correct AME Frontend API with addFileToBatch method
  let jsx = '// Adobe Media Encoder ExtendScript - Add encoding jobs\n'
  jsx += 'try {\n'
  jsx += '  var frontend = app.getFrontend();\n'
  jsx += '  if (!frontend) {\n'
  jsx += '    alert("Error: Could not get AME frontend");\n'
  jsx += '    throw new Error("Frontend not available");\n'
  jsx += '  }\n'
  jsx += '\n'

  jobs.forEach((job, index) => {
    // Escape backslashes properly for ExtendScript
    const escapePath = (p) => p.replace(/\\/g, '\\\\')

    // Extract directory from output path (destination must be folder, not file)
    const outputDir = job.outputPath.substring(0, job.outputPath.lastIndexOf('\\'))

    jsx += `  // Job ${index + 1}: ${job.presetName}\n`
    jsx += `  var source${index} = "${escapePath(job.inputPath)}";\n`
    jsx += `  var destination${index} = "${escapePath(outputDir)}";\n`
    jsx += `  var preset${index} = "${escapePath(job.presetPath)}";\n`
    jsx += `  var result${index} = frontend.addFileToBatch(source${index}, "", preset${index}, destination${index});\n`
    jsx += `  if (!result${index}) {\n`
    jsx += `    alert("Warning: Job ${index + 1} may not have been added successfully");\n`
    jsx += `  }\n`
    jsx += '\n'
  })

  jsx += '  alert("Successfully added ' + jobs.length + ' job(s) to AME queue");\n'
  jsx += '} catch (error) {\n'
  jsx += '  alert("Error adding jobs to AME: " + error.message);\n'
  jsx += '}\n'

  return jsx
}

export async function createPresetFile(presetName, presetXML, version = '25.0') {
  try {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }

    const result = await window.electronAPI.savePresetFile(presetName, presetXML, version)
    return result
  } catch (error) {
    console.error('Error creating preset file:', error)
    throw error
  }
}

