import { torch } from 'environment/mocks'

const { nn } = torch
const { functional: F } = nn

class PolicyValueNet extends (nn.Module) {
  /*policy-value net*/
  constructor(input_dim = 4, planes = 256) {
    super(PolicyValueNet)

    this.conv1 = nn.Conv2d(input_dim, planes, 3, 3, 0, true)

    this.conv2_1 = nn.Conv2d(planes, planes, 1, 1, 0, true)
    this.conv2_2 = nn.Conv2d(planes, planes, 1, 1, 0, true)
    this.bn2_2 = nn.BatchNorm2d(planes, 0.01)

    this.conv3_1 = nn.Conv2d(planes, planes, 3, 1, 0, true)
    this.conv3_2 = nn.Conv2d(planes, planes, 1, 1, 0, true)
    this.bn3_2 = nn.BatchNorm2d(planes, 0.01)

    //policy head:
    this.policy_conv1 = nn.Conv2d(768, planes, 1, 1, 0, true)
    this.policy_bn1 = nn.BatchNorm2d(planes, 0.01)
    this.policy_conv2_1 = nn.Conv2d(planes, planes * 81, 3, 1, 0, true, 256)
    this.policy_conv2_2 = nn.Conv2d(planes, planes, 1, 1, 0, true)
    this.policy_bn2_2 = nn.BatchNorm2d(planes, 0.01)
    this.policy_conv3 = nn.Conv2d(planes + input_dim, 32, 1, 1, 0, true)
    this.policy_logits = nn.Conv2d(32, 1, 1, 1, 0, true)

    //value head:
    this.value_fc1 = nn.Linear(2560, 128)
    this.value_fc2 = nn.Linear(128, 32)
    this.value_fc_scalar = nn.Linear(32, 1)

    this.planes = planes
  }

  forward(x) {
    const batch_size = x.size(0)
    const x1 = F.relu(this.conv1(x))
    const x2 = F.relu(this.bn2_2(this.conv2_2(F.relu(this.conv2_1(x1)))))
    const x3 = F.relu(this.bn3_2(this.conv3_2(F.relu(this.conv3_1(x2)))))

    //policy head
    let p = upsample1to3(x3)
    p = torch.cat((x1, x2, p), 1)
    p = F.relu(this.policy_bn1(this.policy_conv1(p)))
    p = this.policy_conv2_1(p).view(batch_size, 256, 9, 9)
    p = F.relu(this.policy_bn2_2(this.policy_conv2_2(p)))
    p = F.elu(this.policy_conv3(torch.cat((x, p), 1)))
    p = this.policy_logits(p)
    // TODO: convert
    // p = p[:,0]

    //value head:
    let v = torch.cat((x2.view(batch_size, 2304), x3.view(batch_size, 256)), 1)
    v = F.elu(this.value_fc1(v))
    v = F.elu(this.value_fc2(v))
    v = F.tanh(this.value_fc_scalar(v))
    return {
      p,
      v,
    }
  }
}

const upsample1to3 = (x) => {
  //input x dimension: [batch_size, channels, 1, 1]
  x = torch.cat((x, x, x), 2)
  x = torch.cat((x, x, x), 3)
  //output y dimension: [batch_size, channels, 3, 3]
  return x
}
