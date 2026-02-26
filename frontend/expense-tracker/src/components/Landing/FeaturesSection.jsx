import { motion } from 'framer-motion';
import { HiChartPie, HiArrowDownTray, HiWallet, HiShieldCheck,HiBellAlert,HiCurrencyDollar } from 'react-icons/hi2';
import { LuMic } from 'react-icons/lu';
import { MdAutoGraph } from 'react-icons/md';
import PropTypes from 'prop-types';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center text-center p-8 rounded-3xl bg-white hover:bg-primary/5 transition-colors duration-300 group"
  >
    <div className="mb-6 p-4 bg-primary/10 rounded-2xl text-primary">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

FeatureCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  delay: PropTypes.number,
};

const FeaturesSection = () => {
  const features = [
    {
      icon: LuMic,
      title: "TrackO-Bot (AI Voice/Chat)",
      description: "Talk or type to TrackO-Bot! Add expenses, ask questions, and get instant answers with our AI-powered voice and chat assistant.",
    },
    {
      icon: MdAutoGraph,
      title: "Smart Insights",
      description: "Get personalized trends, savings tips, and spending analysis powered by AI. Discover where your money goes and how to improve.",
    },
    {
      icon: HiChartPie,
      title: "Track Expenses",
      description: "Keep track of your daily expenses and income with our easy-to-use interface.",
    },
    {
      icon: HiWallet,
      title: "Budget Planning",
      description: "Set budgets for different categories and stay on top of your financial goals.",
    },    
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white to-purple-50/50">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Features that make managing <br />
            finances easier
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            TrackO provides all the tools you need to manage your finances effectively
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;