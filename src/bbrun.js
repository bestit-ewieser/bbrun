const docker = require("./docker");
const { readTemplate } = require("./template");
const { exec } = require("./exec");
const assert = require("check-types").assert;

const BB_TEMPLATE = "bitbucket-pipelines.yml";

module.exports = function(options, stepName) {
  options.template = options.template || BB_TEMPLATE;
  options.pipeline = options.pipeline || "default";
  options.workDir = options.workDir || "/ws";

  const template = readTemplate(options.template);
  docker.checkExists();

  if (stepName) {
    const stepObject = template.getPipeline(options.pipeline).getStep(stepName);
    assert.nonEmptyObject(
      stepObject,
      `couldn't find step with name="${stepName}"`
    );
    execStep(stepObject.step);
  } else {
    const stepObjects = template.getPipeline(options.pipeline).getAllSteps();
    stepObjects.forEach(stepObject => execStep(stepObject));
  }

  function execStep(step) {
    assert.nonEmptyArray(
      step.script,
      `"script" section not found in step:\n${JSON.stringify(step, null, 4)}`
    );
    const dockerImage = step.image || template.getRootImage();
    const imageName = docker.extractImageName(dockerImage);
    console.log('\x1b[33m%s\x1b[0m',
      `executing step${stepName ? ` "${stepName}"` : ` "${step.name}"`} in "${imageName}"`
    );
    exec(step.script, imageName, options);
  }
};
